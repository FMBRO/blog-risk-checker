import os
import json
import uuid
from typing import Any, Dict, List, Literal, Optional
import re

from fastapi import FastAPI, HTTPException, Path
from fastapi import HTTPException
from pydantic import BaseModel, Field

from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types


# =========================
# Env / Gemini client (Vertex AI)
# =========================
PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if not PROJECT:
    raise RuntimeError("GOOGLE_CLOUD_PROJECT is required")

client = genai.Client(
    vertexai=True,
    project=PROJECT,
    location=LOCATION,
    http_options=types.HttpOptions(api_version="v1"),
).aio


# =========================
# Types
# =========================
PublishScope = Literal["public", "unlisted", "private", "internal"]
Tone = Literal["neutral", "casual", "formal", "technical"]
Audience = Literal["engineers", "general", "internal", "executives"]
RedactMode = Literal["none", "light", "strict"]
MockMode = Literal["auto", "on", "off"]

Verdict = Literal["ok", "warn", "bad"]
Severity = Literal["low", "medium", "high", "critical"]
Persona = Literal["frontend", "security", "legal", "general"]


# =========================
# Request models
# =========================
class CheckSettings(BaseModel):
    publishScope: PublishScope
    tone: Tone
    audience: Audience
    redactMode: RedactMode


class CheckConfig(BaseModel):
    mock: MockMode = "auto"


class CreateCheckRequest(BaseModel):
    text: str = Field(min_length=1)
    settings: CheckSettings
    config: Optional[CheckConfig] = CheckConfig()


class RecheckRequest(BaseModel):
    text: str = Field(min_length=1)
    settings: CheckSettings
    config: Optional[CheckConfig] = CheckConfig()


class PatchRequest(BaseModel):
    checkId: str
    findingId: str
    text: str = Field(min_length=1)
    config: Optional[CheckConfig] = CheckConfig()


class ReleaseRequest(BaseModel):
    checkId: str
    text: str = Field(min_length=1)
    settings: CheckSettings
    config: Optional[CheckConfig] = CheckConfig()



class PersonaReviewRequest(BaseModel):
    text: str = Field(min_length=1)
    settings: CheckSettings
    config: Optional[CheckConfig] = CheckConfig()


# =========================
# In-memory store (MVP)
# =========================
# checkId -> {"text": str, "settings": dict, "report": dict}
CHECK_STORE: Dict[str, Dict[str, Any]] = {}


# =========================
# Helpers
# =========================
def new_check_id() -> str:
    return f"chk_{uuid.uuid4().hex[:16]}"


def new_patch_id() -> str:
    return f"ptc_{uuid.uuid4().hex[:16]}"


def new_release_id() -> str:
    return f"rel_{uuid.uuid4().hex[:16]}"


def should_mock(mode: MockMode) -> bool:
    if mode == "on":
        return True
    if mode == "off":
        return False
    return os.getenv("MOCK", "") in {"1", "true", "True"}


def http_error(status: int, code: str, message: str) -> HTTPException:
    # UI側 fetchJson は error/message を優先する前提
    return HTTPException(status_code=status, detail={"error": code, "message": message})

async def gemini_json(system_instruction: str, user_prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Gemini に JSON 生成を要求し、辞書にして返す。
    schema は response_schema に渡す。
    """
    try:
        resp = await client.models.generate_content(
            model=MODEL_ID,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=schema,
            ),
        )
        return json.loads(resp.text)

    except json.JSONDecodeError:
        raise http_error(502, "BAD_MODEL_OUTPUT", "Model returned non-JSON output")

    except Exception as e:
        msg = str(e)

        # Vertex AI が 429 RESOURCE_EXHAUSTED を返した場合は 429 で返す
        # 例: "429 RESOURCE_EXHAUSTED. {...}"
        if "429" in msg and "RESOURCE_EXHAUSTED" in msg:
            raise HTTPException(
                status_code=429,
                detail={"error": "RESOURCE_EXHAUSTED", "message": msg},
            )

        raise http_error(500, "INTERNAL_ERROR", msg)

def pick_finding(report: Dict[str, Any], finding_id: str) -> Optional[Dict[str, Any]]:
    for f in report.get("findings", []):
        if f.get("id") == finding_id:
            return f
    return None


# =========================
# Schemas (Gemini structured output)
# =========================
REPORT_SCHEMA: Dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "verdict": {"type": "STRING", "enum": ["ok", "warn", "bad"]},
        "score": {"type": "INTEGER", "minimum": 0, "maximum": 100},
        "summary": {
            "type": "OBJECT",
            "properties": {
                "totalFindings": {"type": "INTEGER", "minimum": 0},
                "bySeverity": {
                    "type": "OBJECT",
                    "properties": {
                        "low": {"type": "INTEGER", "minimum": 0},
                        "medium": {"type": "INTEGER", "minimum": 0},
                        "high": {"type": "INTEGER", "minimum": 0},
                        "critical": {"type": "INTEGER", "minimum": 0},
                    },
                    "required": ["low", "medium", "high", "critical"],
                },
                "byCategory": {"type": "OBJECT"},
            },
            "required": ["totalFindings", "bySeverity", "byCategory"],
        },
        "findings": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "id": {"type": "STRING"},
                    "category": {"type": "STRING"},
                    "severity": {"type": "STRING", "enum": ["low", "medium", "high", "critical"]},
                    "title": {"type": "STRING"},
                    "reason": {"type": "STRING"},
                    "suggestion": {"type": "STRING"},
                    "highlights": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "text": {"type": "STRING"},
                                "context": {"type": "STRING"},
                            },
                            "required": ["text", "context"],
                        },
                    },
                    "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["id", "category", "severity", "title", "reason", "suggestion", "highlights"],
            },
        },
        "highlights": {
            "type": "OBJECT",
            "properties": {
                "mode": {"type": "STRING", "enum": ["text"]},
                "items": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "findingId": {"type": "STRING"},
                            "text": {"type": "STRING"},
                        },
                        "required": ["findingId", "text"],
                    },
                },
            },
            "required": ["mode", "items"],
        },
    },
    "required": ["verdict", "score", "summary", "findings", "highlights"],
}

PATCH_GEN_SCHEMA: Dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "originalText": {"type": "STRING"},
        "replacement": {"type": "STRING"},
        "note": {"type": "STRING"},
    },
    "required": ["originalText", "replacement"],
}

RELEASE_SCHEMA: Dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "safeMarkdown": {"type": "STRING"},
        "fixSummary": {"type": "ARRAY", "items": {"type": "STRING"}},
        "checklist": {"type": "ARRAY", "items": {"type": "STRING"}},
        "publishedScope": {"type": "STRING", "enum": ["public", "unlisted", "private", "internal"]},
    },
    "required": ["safeMarkdown", "fixSummary", "checklist", "publishedScope"],
}


PERSONA_SCHEMA: Dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "audience": {"type": "STRING", "enum": ["engineers", "general", "internal", "executives"]},
        "verdict": {"type": "STRING", "enum": ["ok", "warn", "bad"]},
        "summary": {
            "type": "OBJECT",
            "properties": {
                "total": {"type": "INTEGER", "minimum": 0},
                "bySeverity": {
                    "type": "OBJECT",
                    "properties": {
                        "low": {"type": "INTEGER", "minimum": 0},
                        "medium": {"type": "INTEGER", "minimum": 0},
                        "high": {"type": "INTEGER", "minimum": 0},
                        "critical": {"type": "INTEGER", "minimum": 0},
                    },
                    "required": ["low", "medium", "high", "critical"],
                },
            },
            "required": ["total", "bySeverity"],
        },
        "items": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "id": {"type": "STRING"},
                    "severity": {"type": "STRING", "enum": ["low", "medium", "high", "critical"]},
                    "title": {"type": "STRING"},
                    "reason": {"type": "STRING"},
                    "suggestion": {"type": "STRING"},
                    "highlights": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "text": {"type": "STRING"},
                                "context": {"type": "STRING"},
                            },
                            "required": ["text", "context"],
                        },
                    },
                },
                "required": ["id", "severity", "title", "reason", "suggestion", "highlights"],
            },
        },
    },
    "required": ["audience", "verdict", "summary", "items"],
}


# =========================
# Mock payloads
# =========================
MOCK_REPORT = {
    "verdict": "warn",
    "score": 72,
    "summary": {
        "totalFindings": 2,
        "bySeverity": {"low": 0, "medium": 1, "high": 1, "critical": 0},
        "byCategory": {"privacy": 1, "security": 1},
    },
    "findings": [
        {
            "id": "f_001",
            "category": "privacy",
            "severity": "high",
            "title": "個人情報の具体性が高い",
            "reason": "氏名と所属を併記しているため、個人特定の可能性が高い。",
            "suggestion": "氏名を伏せ、所属は業界カテゴリに置換する。",
            "highlights": [{"text": "山田太郎（株式会社ABC）", "context": "..."}],
            "tags": ["pii", "identification"],
        },
        {
            "id": "f_002",
            "category": "security",
            "severity": "medium",
            "title": "内部URLの公開",
            "reason": "社内ホスト名が含まれている。",
            "suggestion": "ドメインを example.com に置換する。",
            "highlights": [{"text": "internal.corp.example.net", "context": "..."}],
            "tags": ["internal"],
        },
    ],
    "highlights": {
        "mode": "text",
        "items": [
            {"findingId": "f_001", "text": "山田太郎（株式会社ABC）"},
            {"findingId": "f_002", "text": "internal.corp.example.net"},
        ],
    },
}

MOCK_PERSONA = {
    "audience": "engineers",
    "verdict": "warn",
    "summary": {"total": 1, "bySeverity": {"low": 0, "medium": 1, "high": 0, "critical": 0}},
    "items": [
        {
            "id": "p_001",
            "severity": "medium",
            "title": "鍵情報の記載に注意",
            "reason": "値の貼り付け誘発につながる。",
            "suggestion": "値は貼らない注意書きを追加する。",
            "highlights": [{"text": "API_KEY=xxxxx", "context": "..."}],
        }
    ],
}

MOCK_RELEASE = {
    "safeMarkdown": "# タイトル\n\n本文（安全化済み）...\n",
    "fixSummary": ["個人名を匿名化した。", "社内URLを example.com に置換した。"],
    "checklist": ["社外秘情報が含まれていない。", "個人情報が匿名化されている。", "鍵情報が含まれていない。"],
    "publishedScope": "unlisted",
}


# =========================
# Prompts
# =========================
CHECK_SYSTEM = """
あなたは技術ブログ公開前チェックのレビューアです。
入力Markdownを精査し、個人情報・セキュリティ・法務/コンプライアンスの観点で指摘を作成してください。
返答は response_schema に厳密に従い、JSONのみを返してください。
severity は low/medium/high/critical を使ってください。
findingsのtitleは問題の要約、reasonは説明、suggestionは修正案を日本語で提案してください。
findings.highlights の text は問題のある箇所の原文そのままの文字列です。context は短い説明です。
highlights.items は findings の highlights と対応させてください（findingId, text）。
"""

PATCH_SYSTEM = """
あなたは文章修正パッチ生成器です。
入力として Markdown 全文、指摘（finding）、および問題のあるテキストが与えられます。
返答は JSON のみです。originalText は置換対象の原文、replacement は置換後の新しい文字列です。
originalText は入力テキスト内に存在する文字列と完全一致させてください。
"""

RELEASE_SYSTEM = """
あなたは公開用の最終整形器です。
入力Markdownと settings を受け取り、安全版Markdown、修正サマリ、公開前チェックリストを作成してください。
返答は JSON のみです。publishedScope は settings.publishScope に一致させてください。
"""

PERSONA_SYSTEM = """
あなたは audience に合わせたレビューアです。
audience に応じた観点（例: engineersなら技術的正確性、generalなら分かりやすさ、executivesならビジネス価値）で Markdown を評価し、指摘を items に列挙してください。
返答は JSON のみです。severity は仕様通りです。
itemsのtitleは問題の要約、reasonは説明、suggestionは修正案を日本語で提案してください。
highlights の text は問題のある箇所の原文そのままの文字列です。context は短い説明です。
"""


def format_settings(s: CheckSettings) -> str:
    return (
        f"publishScope={s.publishScope}\n"
        f"tone={s.tone}\n"
        f"audience={s.audience}\n"
        f"redactMode={s.redactMode}\n"
    )


# =========================
# FastAPI
# =========================
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi import Security, Depends, HTTPException, status

# API Key Auth
API_KEY_NAME = "x-api-key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    expected_api_key = os.getenv("API_KEY")
    # Only enforce if API_KEY is set in environment (e.g. Cloud Run)
    if expected_api_key:
        if not api_key_header or api_key_header != expected_api_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    return api_key_header

app = FastAPI(
    title="Blog Risk Checker API", 
    version="0.2.0",
    dependencies=[Depends(get_api_key)]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/v1/checks")
async def create_check(req: CreateCheckRequest):
    mode = req.config.mock if req.config else "auto"
    if should_mock(mode):
        check_id = new_check_id()
        CHECK_STORE[check_id] = {"text": req.text, "settings": req.settings.model_dump(), "report": MOCK_REPORT}
        return {"checkId": check_id, "report": MOCK_REPORT}

    prompt = f"[settings]\n{format_settings(req.settings)}\n[markdown]\n{req.text}\n"
    report = await gemini_json(CHECK_SYSTEM, prompt, REPORT_SCHEMA)

    check_id = new_check_id()
    CHECK_STORE[check_id] = {"text": req.text, "settings": req.settings.model_dump(), "report": report}
    return {"checkId": check_id, "report": report}


@app.post("/v1/checks/{checkId}/recheck")
async def recheck(
    checkId: str = Path(..., description="checkId from /v1/checks"),
    req: RecheckRequest = None,
):
    mode = req.config.mock if req and req.config else "auto"
    if should_mock(mode):
        CHECK_STORE[checkId] = {"text": req.text, "settings": req.settings.model_dump(), "report": MOCK_REPORT}
        return {"checkId": checkId, "report": MOCK_REPORT}

    prompt = (
        f"[checkId]\n{checkId}\n\n"
        f"[settings]\n{format_settings(req.settings)}\n"
        f"[markdown]\n{req.text}\n"
    )
    report = await gemini_json(CHECK_SYSTEM, prompt, REPORT_SCHEMA)

    CHECK_STORE[checkId] = {"text": req.text, "settings": req.settings.model_dump(), "report": report}
    return {"checkId": checkId, "report": report}


@app.post("/v1/patches")
async def create_patch(req: PatchRequest):
    mode = req.config.mock if req.config else "auto"
    if should_mock(mode):
        return {
            "patchId": new_patch_id(),
            "findingId": req.findingId,
            "before": "Before ...",
            "after": "After ...",
            "apply": {"mode": "replaceText", "originalText": "Before ...", "replacement": "After ..."},
        }

    # 優先: 保存済み report から finding を取る
    saved = CHECK_STORE.get(req.checkId)
    finding = None
    report = None
    if saved:
        report = saved.get("report")
        finding = pick_finding(report, req.findingId) if report else None

    # finding が無い場合は最小でエラーにする（MVP）
    if not finding:
        raise http_error(404, "NOT_FOUND", "findingId not found for this checkId")

    # 1st highlight を採用（UIも基本1つ目を使う想定）
    h0 = finding["highlights"][0]
    original_text = h0["text"]

    patch_prompt = (
        f"[checkId]\n{req.checkId}\n\n"
        f"[finding]\n{json.dumps(finding, ensure_ascii=False)}\n\n"
        f"[originalText]\n{original_text}\n\n"
        f"[full_markdown]\n{req.text}\n"
    )

    gen = await gemini_json(PATCH_SYSTEM, patch_prompt, PATCH_GEN_SCHEMA)

    original = str(gen["originalText"])
    replacement = str(gen["replacement"])

    return {
        "patchId": new_patch_id(),
        "findingId": req.findingId,
        "before": original,
        "after": replacement,
        "apply": {"mode": "replaceText", "originalText": original, "replacement": replacement},
    }


@app.post("/v1/release")
async def release(req: ReleaseRequest):
    mode = req.config.mock if req.config else "auto"
    if should_mock(mode):
        return {
            "releaseId": new_release_id(),
            "verdict": "ok",
            **MOCK_RELEASE,
            "publishedScope": req.settings.publishScope,
        }

    saved = CHECK_STORE.get(req.checkId)
    if not saved:
        raise http_error(404, "NOT_FOUND", "checkId not found")

    report = saved.get("report")
    score = (report or {}).get("score", 0)
    if score < 70:
        raise http_error(409, "LOW_SCORE", "release requires report.score >= 70")

    prompt = (
        f"[checkId]\n{req.checkId}\n\n"
        f"[settings]\n{format_settings(req.settings)}\n"
        f"[markdown]\n{req.text}\n"
    )
    out = await gemini_json(RELEASE_SYSTEM, prompt, RELEASE_SCHEMA)

    # publishedScope は settings に揃える（念のため）
    out["publishedScope"] = req.settings.publishScope

    return {"releaseId": new_release_id(), "verdict": "ok", **out}


@app.post("/v1/persona-review")
async def persona_review(req: PersonaReviewRequest):
    mode = req.config.mock if req.config else "auto"
    if should_mock(mode):
        mock = dict(MOCK_PERSONA)
        # mockのaudienceを上書き
        mock["audience"] = req.settings.audience
        return mock

    prompt = (
        f"[settings]\n{format_settings(req.settings)}\n"
        f"[markdown]\n{req.text}\n"
    )
    out = await gemini_json(PERSONA_SYSTEM, prompt, PERSONA_SCHEMA)

    # audience は入力に揃える（念のため）
    out["audience"] = req.settings.audience
    return out
