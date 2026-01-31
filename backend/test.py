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
- /v1/release は "保存済み report の score >= 70" のときのみ成功します。
  そのため、このスクリプトは patch を全 finding に対して適用 → recheck → ok なら release を試行します。
"""

from __future__ import annotations

import os
import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
load_dotenv()

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
    
    headers = {}
    # Read API_KEY from env
    api_key = os.getenv("API_KEY")
    if api_key:
        headers["x-api-key"] = api_key

    r = requests.post(url, json=payload, headers=headers, timeout=timeout)
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
def apply_replace_text(text: str, original_text: str, replacement: str) -> str:
    """
    text 内の original_text を replacement に置換する（最初の1件のみ）。
    """
    if original_text not in text:
        print(f"[warn] original_text not found in text: {original_text[:50]}...")
        return text
    return text.replace(original_text, replacement, 1)


# -------------------------
# Flow
# -------------------------

@dataclass
class FlowConfig:
    base_url: str
    mock: str  # on/off/auto
    settings: Dict[str, Any]


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

    # 2) persona review (audience based)
    print("\n=== 2) POST /v1/persona-review")
    persona_req = {
        "text": text,
        "settings": cfg.settings,
        "config": {"mock": cfg.mock},
    }
    persona_res = post_json(cfg.base_url, "/v1/persona-review", persona_req)
    print(pretty({"audience": persona_res.get("audience"), "verdict": persona_res.get("verdict"), "total": persona_res.get("summary", {}).get("total")}))

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
            if apply.get("mode") != "replaceText":
                print(f"[warn] unsupported apply mode: {apply}")
                continue

            original_text = str(apply["originalText"])
            replacement = str(apply["replacement"])

            working_text = apply_replace_text(working_text, original_text, replacement)

            print(pretty({
                "findingId": fid,
                "beforePreview": original_text[:80],
                "afterPreview": replacement[:80],
            }))

    # 4) recheck
    print("\n=== 4) POST /v1/checks/{checkId}/recheck")
    recheck_req = {"text": working_text, "settings": cfg.settings, "config": {"mock": cfg.mock}}
    recheck_res = post_json(cfg.base_url, f"/v1/checks/{check_id}/recheck", recheck_req)
    new_report = recheck_res.get("report", {})
    verdict = new_report.get("verdict")
    score = new_report.get("score", 0)
    print(pretty({"checkId": check_id, "verdict": verdict, "score": score, "totalFindings": new_report.get("summary", {}).get("totalFindings")}))

    # 5) release (only if score >= 70)
    print("\n=== 5) POST /v1/release (only if score >= 70)")
    if score < 70:
        print(f"[info] score {score} < 70. skip release.")
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
    )

    run_flow(text, cfg)


if __name__ == "__main__":
    main()
