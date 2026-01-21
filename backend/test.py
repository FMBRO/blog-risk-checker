"""
test.py
- /v1/checks -> /v1/persona-review -> /v1/patches(複数) -> /v1/checks/{checkId}/recheck -> /v1/release
- requests を使用
- mock を on/off で切替可能

前提:
- main.py を起動済み: uvicorn main:app --reload --port 8000
- sample_blog.md が同階層にある（無ければ SAMPLE_TEXT を使う）

実行例:
  python test.py --base-url http://localhost:8000 --md sample_blog.md --mock on
  python test.py --base-url http://localhost:8000 --md sample_blog.md --mock off

注意:
- /v1/release は "保存済み report の verdict が ok" のときのみ成功します。
  そのため、このスクリプトは patch を全 finding に対して適用 → recheck → ok なら release を試行します。
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests


# -------------------------
# Defaults
# -------------------------
SAMPLE_TEXT = """# サンプル

これはテスト用のブログ本文です。
田中 太郎 / tanaka.taro@toppan.example.jp
社内URL: http://intra-admin.toppan.local:8080/
鍵っぽい: sk-THIS_IS_NOT_REAL_BUT_LOOKS_LIKE_A_KEY
"""

DEFAULT_SETTINGS = {
    "publishScope": "public",
    "tone": "technical",
    "audience": "engineers",
    "redactMode": "light",
}


# -------------------------
# HTTP helpers
# -------------------------
def post_json(base_url: str, path: str, payload: Dict[str, Any], timeout: int = 300) -> Dict[str, Any]:
    url = base_url.rstrip("/") + path
    r = requests.post(url, json=payload, timeout=timeout)
    if not r.ok:
        # FastAPI detail={"error","message"} を優先表示
        try:
            detail = r.json().get("detail")
        except Exception:
            detail = None
        raise RuntimeError(f"HTTP {r.status_code} {url}\nresponse={r.text}\ndetail={detail}")
    return r.json()


def pretty(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


# -------------------------
# Markdown apply patch
# -------------------------
def apply_replace_range(text: str, start: int, end: int, replacement: str) -> str:
    if start < 0 or end < 0 or start > len(text) or end > len(text):
        raise ValueError(f"invalid range start={start} end={end} len={len(text)}")
    if end < start:
        start, end = end, start
    return text[:start] + replacement + text[end:]


def calc_delta(start: int, end: int, replacement: str) -> int:
    return len(replacement) - (end - start)


def adjust_remaining_ranges(
    findings: List[Dict[str, Any]],
    current_index: int,
    applied_start: int,
    applied_end: int,
    delta: int,
) -> None:
    """
    先に適用した置換の文字数差(delta)を、後続 finding の start/end に反映する。
    - applied_end より後ろにある range は一律で delta だけシフト
    - 交差する range は精密に扱わず、MVPとして context のみ残す（rangeは維持/クランプ）
    """
    for i in range(current_index + 1, len(findings)):
        for r in findings[i].get("ranges", []) or []:
            s = int(r.get("start", 0))
            e = int(r.get("end", 0))
            # 完全に後ろ
            if s >= applied_end:
                r["start"] = s + delta
                r["end"] = e + delta
            # 完全に前
            elif e <= applied_start:
                continue
            # 交差
            else:
                # 交差は保守的に clamping（細かい整合は recheck が拾う想定）
                r["start"] = max(0, min(s, e))
                r["end"] = max(0, max(s, e))


# -------------------------
# Flow
# -------------------------
@dataclass
class FlowConfig:
    base_url: str
    mock: str  # on/off/auto
    settings: Dict[str, Any]
    persona: str  # frontend/security/legal/general


def load_markdown(md_path: Optional[str]) -> str:
    if not md_path:
        return SAMPLE_TEXT
    p = Path(md_path)
    if not p.exists():
        print(f"[warn] md file not found: {md_path}. Use SAMPLE_TEXT.", file=sys.stderr)
        return SAMPLE_TEXT
    return p.read_text(encoding="utf-8")


def run_flow(text: str, cfg: FlowConfig) -> None:
    print("=== 0) Input markdown length:", len(text))

    # 1) create check
    print("\n=== 1) POST /v1/checks")
    create_req = {"text": text, "settings": cfg.settings, "config": {"mock": cfg.mock}}
    create_res = post_json(cfg.base_url, "/v1/checks", create_req)
    print(pretty({"checkId": create_res.get("checkId"), "verdict": create_res.get("report", {}).get("verdict")}))

    check_id = create_res["checkId"]
    report = create_res["report"]
    findings = report.get("findings", []) or []

    # 2) persona review
    print("\n=== 2) POST /v1/persona-review")
    persona_req = {
        "persona": cfg.persona,
        "text": text,
        "settings": cfg.settings,
        "config": {"mock": cfg.mock},
    }
    persona_res = post_json(cfg.base_url, "/v1/persona-review", persona_req)
    print(pretty({"persona": persona_res.get("persona"), "verdict": persona_res.get("verdict"), "total": persona_res.get("summary", {}).get("total")}))

    # 3) patches (apply sequentially)
    print("\n=== 3) POST /v1/patches (for each finding) + apply locally")
    working_text = text

    if not findings:
        print("[info] no findings. skip patch step.")
    else:
        for idx, f in enumerate(findings):
            fid = f.get("id")
            if not fid:
                continue

            patch_req = {"checkId": check_id, "findingId": fid, "text": working_text, "config": {"mock": cfg.mock}}
            patch_res = post_json(cfg.base_url, "/v1/patches", patch_req)

            apply = patch_res.get("apply", {})
            if apply.get("mode") != "replaceRange":
                print(f"[warn] unsupported apply mode: {apply}")
                continue

            start = int(apply["start"])
            end = int(apply["end"])
            replacement = str(apply["replacement"])

            before_len = len(working_text)
            before_snip = working_text[start:end]

            working_text = apply_replace_range(working_text, start, end, replacement)

            delta = len(working_text) - before_len
            adjust_remaining_ranges(findings, idx, start, end, delta)

            print(pretty({
                "findingId": fid,
                "range": {"start": start, "end": end},
                "beforePreview": before_snip[:80],
                "afterPreview": replacement[:80],
                "deltaChars": delta,
            }))

    # 4) recheck
    print("\n=== 4) POST /v1/checks/{checkId}/recheck")
    recheck_req = {"text": working_text, "settings": cfg.settings, "config": {"mock": cfg.mock}}
    recheck_res = post_json(cfg.base_url, f"/v1/checks/{check_id}/recheck", recheck_req)
    new_report = recheck_res.get("report", {})
    verdict = new_report.get("verdict")
    print(pretty({"checkId": check_id, "verdict": verdict, "score": new_report.get("score"), "totalFindings": new_report.get("summary", {}).get("totalFindings")}))

    # 5) release (only if ok)
    print("\n=== 5) POST /v1/release (only if verdict==ok)")
    if verdict != "ok":
        print("[info] verdict is not ok. skip release.")
        return

    release_req = {"checkId": check_id, "text": working_text, "settings": cfg.settings, "config": {"mock": cfg.mock}}
    release_res = post_json(cfg.base_url, "/v1/release", release_req)
    print(pretty({
        "releaseId": release_res.get("releaseId"),
        "verdict": release_res.get("verdict"),
        "publishedScope": release_res.get("publishedScope"),
        "fixSummaryCount": len(release_res.get("fixSummary", []) or []),
        "checklistCount": len(release_res.get("checklist", []) or []),
    }))

    safe_md = release_res.get("safeMarkdown", "")
    if safe_md:
        out_path = Path("safe_markdown.md")
        out_path.write_text(safe_md, encoding="utf-8")
        print(f"[ok] wrote: {out_path.resolve()}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://localhost:8000")
    ap.add_argument("--md", default=None, help="path to markdown file (optional)")
    ap.add_argument("--mock", default="auto", choices=["auto", "on", "off"])
    ap.add_argument("--publish-scope", default=DEFAULT_SETTINGS["publishScope"], choices=["public", "unlisted", "private", "internal"])
    ap.add_argument("--tone", default=DEFAULT_SETTINGS["tone"], choices=["neutral", "casual", "formal", "technical"])
    ap.add_argument("--audience", default=DEFAULT_SETTINGS["audience"], choices=["engineers", "general", "internal", "executives"])
    ap.add_argument("--redact-mode", default=DEFAULT_SETTINGS["redactMode"], choices=["none", "light", "strict"])
    ap.add_argument("--persona", default="security", choices=["frontend", "security", "legal", "general"])
    args = ap.parse_args()

    text = load_markdown(args.md)
    cfg = FlowConfig(
        base_url=args.base_url,
        mock=args.mock,
        settings={
            "publishScope": args.publish_scope,
            "tone": args.tone,
            "audience": args.audience,
            "redactMode": args.redact_mode,
        },
        persona=args.persona,
    )

    run_flow(text, cfg)


if __name__ == "__main__":
    main()
