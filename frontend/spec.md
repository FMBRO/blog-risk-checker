frontend

# Blog Risk Checker（MVP）フロントエンド仕様（React）

## 0. 目的と主要ユースケース

### 目的
- ユーザーが本文（Markdown）を編集し、公開リスクチェック結果（指摘）を確認する。
- 指摘箇所を本文内ハイライトで可視化する。
- 指摘ごとに理由（Reason）と修正提案（Suggestion）を提示する。

### 主要ユースケース
1. ユーザーが本文を編集する。
2. ユーザーが「Check」を実行する。
3. 右ペインで総合判定と指摘一覧を確認する。
4. 指摘を選択し、本文側の該当箇所ハイライトを確認する。
5. 「Export」から出力操作を行う（形式はドロップダウン）。

---

## 1. 画面レイアウト仕様

### 全体構成（2カラム）
- 上部ヘッダー（固定）
- 本文領域（左右分割）
  - 左：エディタ領域（Markdown）
  - 右：結果領域（Findings / Persona）

### 比率（目安）
- 左：60〜70%
- 右：30〜40%

### スクロール
- 左エディタ：独立スクロール（行番号があるため内部スクロール推奨）
- 右結果：独立スクロール（カード一覧）

---

## 2. ヘッダー仕様（Top Bar）

### 表示要素（左→右）
1. アプリアイコン（四角内のレイヤー風アイコン）
2. プロジェクト名 + ドキュメント名  
   - 例：`Project Alpha / draft-v1`
3. 保存状態表示  
   - 例：`[Auto-saved]`
4. 操作ボタン群（右寄せ）
   - Primary：`Check`（青、丸角）
     - 未読通知ドット（赤）をボタン右上に表示
   - Secondary：`Export`（グレー、ドロップダウン）

### 挙動
- Checkクリック：チェック処理開始（ローディング状態が必要）
- Exportクリック：メニュー表示（クリック外で閉じる）

---

## 3. 設定バー仕様（Editor上部）

### 表示
- 1行の横長バー（折りたたみ可能）
- 文言例：`Settings: Public / Technical / Engineers... (Click to expand)`
- 右端にドロップダウン矢印
- 省略表示（…）対応

### 内容（最低限）
- 公開先（例：Public）
- トーン（例：Technical）
- 想定読者（例：Engineers）

### 挙動
- クリックでインライン展開（モーダルではない）
- 選択変更は「次回Checkの条件」に反映する

---

## 4. 左ペイン仕様（Markdown Editor）

### 表示要素
- 行番号（左ガター）
- Markdownテキスト
- 指摘ハイライト（黄色背景）

### 編集仕様
- プレーンMarkdown入力（MVPは最低限）
- ハイライトは「チェック結果の ranges / highlights」に基づきオーバーレイ表示
- カーソル位置とハイライト表示の整合が必要（CodeMirror / Monaco 等を想定）

### ハイライト仕様
- 種別ごとのスタイル差を許容（基本は黄色）
- クリック時に「該当指摘カード選択」へ同期（任意だが自然）

---

## 5. 右ペイン仕様（Findings / Persona）

### タブ
- Findings（デフォルト）
- Persona
- 選択状態：下線（青）＋文字色変化

### Findings上部サマリ
- 表示例：`Overall Verdict: Passed / 3 Warnings`
- ステータスアイコン（例：緑チェック）
- Passed / 要修正 / ブロックでバッジ色を変更できる想定

### フィルタチップ
- `All / High / Low`
- ピル型ボタン
- 選択状態は背景色変更

---

## 6. 指摘カード仕様（Findings内）

### カード共通構成
- 左に強いアクセントボーダー（カテゴリ色）
  - Security：赤
  - Tone：黄（例）
- カテゴリラベル（角丸バッジ）  
  - 例：`[Security]`
- タイトル（太字）  
  - 例：`API Key exposed`
- 折りたたみトグル（右上の山形）
  - 展開で詳細表示（Reason / Suggestion）

### 詳細項目
- `Reason:`（理由テキスト）
- `Suggestion:`（提案テキスト）

### リスト表示
- 縦並び
- 右ペイン内部スクロール
- カード間は余白で区切る

### 選択状態（推奨）
- 選択カードは背景を強調
- 選択に連動して左エディタの該当rangeへスクロールし、強調表示する

---

## 7. データモデル仕様（フロントエンド）

### チェック結果（最低限）
- `overallVerdict`
  - `status: "passed" | "needs_fix" | "blocked"`
  - `summaryText: string`（例：`Passed / 3 Warnings`）
  - `counts: { high: number, low: number, total: number }`
- `findings[]`
  - `id: string`
  - `category: "security" | "tone" | ...`
  - `severity: "high" | "low"`
  - `title: string`
  - `reason: string`
  - `suggestion: string`
  - `ranges[]: { startLine: number, startCol: number, endLine: number, endCol: number }`
  - `collapsed: boolean`（UI状態）
- `persona`（右タブ用）
  - `activePersonaId`
  - `reviews[]` 等（枠のみ）

---

## 8. 状態管理仕様（React）

### 画面状態（例）
- `docTitle, projectName, isAutosaved`
- `settings`（公開先 / トーン / 想定読者 / マスク）
- `editorText`
- `checkState: "idle" | "running" | "done" | "error"`
- `results`（チェック結果）
- `activeTab: "findings" | "persona"`
- `severityFilter: "all" | "high" | "low"`
- `selectedFindingId`

### 非同期
- Check実行でAPI呼び出し
- 実行中はボタン無効化＋スピナー表示
- エラー時は右ペイン上部にエラーバナーを表示する

---

## 9. 主要イベント仕様

- `onClickCheck()`
  - `settings + editorText` を送信する
  - `results` を更新する
  - ハイライトを再計算する
- `onChangeEditor(text)`
  - `editorText` 更新
  - `Auto-saved` 表示更新
- `onSelectTab(tab)`
  - `activeTab` 更新
- `onChangeSeverityFilter(filter)`
  - 指摘フィルタ適用
- `onToggleFindingCollapse(id)`
  - `collapsed` 切替
- `onSelectFinding(id)`
  - `selectedFindingId` 更新
  - エディタ側で該当rangeへスクロールし、強調表示する

---

## 10. コンポーネント分割案（React）

- `AppShell`
  - `TopBar`
    - `ProjectTitle`
    - `CheckButton`
    - `ExportMenuButton`
  - `MainSplitPane`
    - `EditorPane`
      - `SettingsBar`
      - `MarkdownEditor`（行番号 + rangesハイライト）
    - `ResultsPane`
      - `Tabs`（Findings / Persona）
      - `FindingsView`
        - `VerdictBanner`
        - `SeverityFilterChips`
        - `FindingCardList`
          - `FindingCard`
      - `PersonaView`（枠）

---

## 11. レスポンシブ仕様（縦長ディスプレイ想定）

- 幅が狭い場合（タブレット縦・スマホ）
  - 2カラム → 1カラムへ切替
  - 上：Editor、下：Findings（またはタブで切替）
- Check / Export はヘッダー固定で常に表示する

---

# API連携仕様（フロント視点）

## 12. API利用方針

### Base URL
- `API_BASE_URL`（例：`http://localhost:8000`）

### fetch方針
- fetch wrapper を用意し、`detail.error / detail.message` をUIに表示する。
- 送信データは常に全文送信を基本とする。

### 送信データの基本
- `text: Markdown全文`
- `settings: UI設定バー`
- `config.mock: "auto" | "on" | "off"`（MVPは auto）

---

## 13. 画面状態とAPIの対応

### 必須状態
- `draftText: string`
- `settings: { publishScope, tone, audience, redactMode }`
- `checkId: string | null`
- `report: Report | null`
- `personaResult: PersonaReview | null`
- `activeTab: "findings" | "persona"`
- `severityFilter: "all" | "high" | "low"`
- `selectedFindingId: string | null`
- `collapsedFindingIds: Set<string>`

### 実行状態
- `checkStatus: "idle" | "running" | "success" | "error"`
- `patchStatusByFindingId: Record<string, "idle"|"running"|"success"|"error">`
- `releaseStatus: "idle"|"running"|"success"|"error"`

---

## 14. API仕様（フロント視点）

### 14.1 POST `/v1/checks`（初回チェック）
#### 用途
- Checkボタン押下で呼ぶ。
- 成功時に `checkId` と `report` を受け取り、Findings描画とハイライト描画を行う。

#### Request
- `text: string`
- `settings: CheckSettings`
- `config?: { mock: "auto"|"on"|"off" }`

#### Response
- `{ checkId: string, report: Report }`

#### UI制御
- 実行中：Check disabled + spinner
- 成功：Verdict更新、指摘カード更新、ハイライト更新
- 失敗：右ペイン上部にエラーバナー（message表示）

---

### 14.2 POST `/v1/checks/{checkId}/recheck`（再チェック）
#### 用途
- Fix後の「再チェック」相当。
- 既存 `checkId` を維持しつつ `report` を更新する。

#### Request/Response
- `/v1/checks` と同じ（pathに `checkId` を含む）

#### UI制御
- `checkId` が無い場合は `/v1/checks` を呼ぶ（フロントで分岐）
- 成功時：`report` を上書きし、折りたたみ状態は維持する（推奨）

---

### 14.3 POST `/v1/patches`（修正パッチ生成）
#### 用途
- 指摘カードの「提案適用（Apply）」で呼ぶ。
- 返却の `apply` をエディタに反映する（`replaceRange`）。

#### Request
- `checkId: string`（必須）
- `findingId: string`（必須）
- `text: string`（全文）
- `config?: { mock }`

#### Response
```json
{
  "patchId": "ptc_...",
  "findingId": "f_001",
  "before": "...",
  "after": "...",
  "range": {"start": 10, "end": 30},
  "apply": {"mode": "replaceRange", "start": 10, "end": 30, "replacement": "..."}
}

UI制御

checkId が無い場合：Patch操作はdisabled（MVP）

実行中：該当カードにローディング

成功：エディタに適用 → recheck を促す（自動でも手動でもよい）

失敗：カード内にエラー（message表示）



---

14.4 POST /v1/release（最終出力）

用途

report.verdict === "ok" のときだけ呼べる（サーバも 409 で拒否）。

safeMarkdown / fixSummary / checklist を受け取り、Release表示に使う。


Request

checkId: string

text: string

settings

config?


Response

{
  "releaseId": "rel_...",
  "verdict": "ok",
  "safeMarkdown": "...",
  "fixSummary": ["..."],
  "checklist": ["..."],
  "publishedScope": "public|unlisted|private|internal"
}

UI制御

report.verdict !== "ok"：Release disabled + tooltip

409：release requires report.verdict === 'ok' を表示し、再修正を促す



---

14.5 POST /v1/persona-review（ペルソナレビュー）

用途

右ペインの Persona タブで呼ぶ。

persona 切替で再実行する。


Request

persona: "frontend"|"security"|"legal"|"general"

text, settings, config?


Response

PersonaReview（items配列）


UI制御

Personaタブ初回表示時に自動実行（推奨）

personaResult.items をカード一覧として描画する（FindingsとUI共通化が可能）



---

15. 型定義（TypeScript想定）

Settings

publishScope: "public"|"unlisted"|"private"|"internal"

tone: "neutral"|"casual"|"formal"|"technical"

audience: "engineers"|"general"|"internal"|"executives"

redactMode: "none"|"light"|"strict"


Report（/v1/checks）

verdict: "ok"|"warn"|"bad"

score: number (0..100)

summary.totalFindings: number

summary.bySeverity: { low, medium, high, critical }

findings[]: { id, category, severity, title, reason, suggestion, ranges[], tags? }

highlights: { mode: "ranges", items: [{ findingId, start, end }] }


PersonaReview（/v1/persona-review）

persona

verdict

summary.total

summary.bySeverity

items[]: { id, severity, title, reason, suggestion, ranges[] }



---

16. Severityフィルタ集約ルール（UI: All / High / Low）

サーバ：low / medium / high / critical
UI：All / High / Low の3段階

High：high または critical

Low：low または medium

All：全件


運用例：

バナー表示は Passed / 3 Warnings 形式とし、verdict=warn のとき summary.totalFindings を warnings として表示する。



---

17. ハイライト適用仕様（Editor）

レンジ仕様

APIの ranges.start/end と highlights.items.start/end は文字オフセット（0..len(text)）

Reactエディタで (line,col) が必要な場合は変換が必要

MVPは「オフセットベースのデコレーション」を使う（CodeMirror6 / Monaco で対応可能）


表示優先

report.highlights.items を描画の正とする（finding.rangesと重複しても items を優先）


選択連動

selectedFindingId と一致するハイライトを強調（枠線 / 濃い背景）

クリックで該当箇所へスクロールする



---

18. 画面の操作フロー（API結合）

18.1 Check

1. POST /v1/checks（checkId が無い場合）


2. 成功 → checkId, report をstateへ保存


3. Findingsタブでカード表示、Editorでハイライト表示



18.2 Patch → Apply → Recheck

1. 指摘カードのApply → POST /v1/patches


2. apply.replaceRange を draftText に反映


3. 再チェック → POST /v1/checks/{checkId}/recheck


4. report 更新 → ハイライト更新



18.3 Persona

1. Personaタブ表示 → POST /v1/persona-review


2. items をカード表示（FindingsのUIを流用）



18.4 Release

1. report.verdict === "ok" のときだけ POST /v1/release


2. safeMarkdown / fixSummary / checklist を表示


3. ExportメニューでコピーやDLなどの出力を行う（フロント側）




---

19. エラーハンドリング仕様

方針

サーバは HTTPException(detail={ error, message }) を返す。

フロントは res.ok === false のとき detail.message をユーザーへ表示する。

detail.error はログや開発者向け表示に使う。


代表例

404 NOT_FOUND：checkId / findingId 不一致

409 NOT_OK：Release条件未達（verdict が ok でない）

502 BAD_MODEL_OUTPUT：モデル出力不正（JSONでない）

500 INTERNAL_ERROR：その他



---

20. ReactコンポーネントとAPIの接続点（最小）

CheckButton → createCheck() / recheck()

FindingCard → createPatch(findingId)（checkId 必須）

PersonaTab → personaReview(persona)

ReleaseButton → release()

Backend code

---

requirements.txt

fastapi>=0.110
uvicorn[standard]>=0.27
pydantic>=2.6
google-genai>=0.3


---

main.py（単体で動く）

import os
import json
import uuid
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Path
from pydantic import BaseModel, Field

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
    persona: Persona
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
        raise http_error(500, "INTERNAL_ERROR", str(e))


def pick_finding(report: Dict[str, Any], finding_id: str) -> Optional[Dict[str, Any]]:
    for f in report.get("findings", []):
        if f.get("id") == finding_id:
            return f
    return None


def clamp_range(start: int, end: int, n: int) -> tuple[int, int]:
    s = max(0, min(start, n))
    e = max(0, min(end, n))
    if e < s:
        s, e = e, s
    return s, e


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
                    "ranges": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "start": {"type": "INTEGER", "minimum": 0},
                                "end": {"type": "INTEGER", "minimum": 0},
                                "context": {"type": "STRING"},
                            },
                            "required": ["start", "end", "context"],
                        },
                    },
                    "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["id", "category", "severity", "title", "reason", "suggestion", "ranges"],
            },
        },
        "highlights": {
            "type": "OBJECT",
            "properties": {
                "mode": {"type": "STRING", "enum": ["ranges"]},
                "items": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "findingId": {"type": "STRING"},
                            "start": {"type": "INTEGER", "minimum": 0},
                            "end": {"type": "INTEGER", "minimum": 0},
                        },
                        "required": ["findingId", "start", "end"],
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
        "replacement": {"type": "STRING"},
        "note": {"type": "STRING"},
        "start": {"type": "INTEGER", "minimum": 0},
        "end": {"type": "INTEGER", "minimum": 0},
    },
    "required": ["replacement", "start", "end"],
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
        "persona": {"type": "STRING", "enum": ["frontend", "security", "legal", "general"]},
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
                    "ranges": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "start": {"type": "INTEGER", "minimum": 0},
                                "end": {"type": "INTEGER", "minimum": 0},
                                "context": {"type": "STRING"},
                            },
                            "required": ["start", "end", "context"],
                        },
                    },
                },
                "required": ["id", "severity", "title", "reason", "suggestion", "ranges"],
            },
        },
    },
    "required": ["persona", "verdict", "summary", "items"],
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
            "ranges": [{"start": 10, "end": 30, "context": "..."}],
            "tags": ["pii", "identification"],
        },
        {
            "id": "f_002",
            "category": "security",
            "severity": "medium",
            "title": "内部URLの公開",
            "reason": "社内ホスト名が含まれている。",
            "suggestion": "ドメインを example.com に置換する。",
            "ranges": [{"start": 60, "end": 90, "context": "..."}],
            "tags": ["internal"],
        },
    ],
    "highlights": {
        "mode": "ranges",
        "items": [
            {"findingId": "f_001", "start": 10, "end": 30},
            {"findingId": "f_002", "start": 60, "end": 90},
        ],
    },
}

MOCK_PERSONA = {
    "persona": "security",
    "verdict": "warn",
    "summary": {"total": 1, "bySeverity": {"low": 0, "medium": 1, "high": 0, "critical": 0}},
    "items": [
        {
            "id": "p_001",
            "severity": "medium",
            "title": "鍵情報の記載に注意",
            "reason": "値の貼り付け誘発につながる。",
            "suggestion": "値は貼らない注意書きを追加する。",
            "ranges": [{"start": 20, "end": 50, "context": "..."}],
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
ranges は文字オフセット（start,end）です。context は短い抜粋です。
highlights.items は findings の ranges と対応させてください（findingId,start,end）。
"""

PATCH_SYSTEM = """
あなたは文章修正パッチ生成器です。
入力として Markdown 全文、指摘（finding）、および推奨レンジが与えられます。
返答は JSON のみです。replacement はレンジ置換の新しい文字列です。
start/end は返答にも含め、レンジは可能な限り元の値を維持してください。
"""

RELEASE_SYSTEM = """
あなたは公開用の最終整形器です。
入力Markdownと settings を受け取り、安全版Markdown、修正サマリ、公開前チェックリストを作成してください。
返答は JSON のみです。publishedScope は settings.publishScope に一致させてください。
"""

PERSONA_SYSTEM = """
あなたはペルソナ別レビューアです。
persona に応じた観点で Markdown を評価し、指摘を items に列挙してください。
返答は JSON のみです。severity と ranges は仕様通りです。
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
app = FastAPI(title="Blog Risk Checker API", version="0.2.0")


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
            "range": {"start": 0, "end": 10},
            "apply": {"mode": "replaceRange", "start": 0, "end": 10, "replacement": "After ..."},
        }

    # 優先: 保存済み report から finding/range を取る
    saved = CHECK_STORE.get(req.checkId)
    finding = None
    report = None
    if saved:
        report = saved.get("report")
        finding = pick_finding(report, req.findingId) if report else None

    # finding が無い場合は最小でエラーにする（MVP）
    if not finding:
        raise http_error(404, "NOT_FOUND", "findingId not found for this checkId")

    # 1st range を採用（UIも基本1つ目を使う想定）
    r0 = finding["ranges"][0]
    start, end = clamp_range(int(r0["start"]), int(r0["end"]), len(req.text))
    before = req.text[start:end]

    patch_prompt = (
        f"[checkId]\n{req.checkId}\n\n"
        f"[finding]\n{json.dumps(finding, ensure_ascii=False)}\n\n"
        f"[range]\nstart={start}, end={end}\n\n"
        f"[before]\n{before}\n\n"
        f"[full_markdown]\n{req.text}\n"
    )

    gen = await gemini_json(PATCH_SYSTEM, patch_prompt, PATCH_GEN_SCHEMA)

    # モデルが範囲を書き換えた場合も clamp する
    ms, me = clamp_range(int(gen["start"]), int(gen["end"]), len(req.text))
    replacement = str(gen["replacement"])
    before2 = req.text[ms:me]

    return {
        "patchId": new_patch_id(),
        "findingId": req.findingId,
        "before": before2,
        "after": replacement,
        "range": {"start": ms, "end": me},
        "apply": {"mode": "replaceRange", "start": ms, "end": me, "replacement": replacement},
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
    verdict = (report or {}).get("verdict")
    if verdict != "ok":
        raise http_error(409, "NOT_OK", "release requires report.verdict === 'ok'")

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
        mock["persona"] = req.persona
        return mock

    prompt = (
        f"[persona]\n{req.persona}\n\n"
        f"[settings]\n{format_settings(req.settings)}\n"
        f"[markdown]\n{req.text}\n"
    )
    out = await gemini_json(PERSONA_SYSTEM, prompt, PERSONA_SCHEMA)

    # persona は入力に揃える（念のため）
    out["persona"] = req.persona
    return out


---

起動（例）

export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
# 任意
export GEMINI_MODEL="gemini-2.5-flash"

uvicorn main:app --reload --port 8000


---

使い方メモ（UI前提のポイント）

/v1/patches は checkId と findingId が必要です。サーバは CHECK_STORE から finding を引きます（MVP仕様）。

/v1/release は 保存済みレポートの verdict が ok の場合のみ成功します（UIのボタン制御と一致）。



---

Backend

---

## 共通

### Base URL
- `baseUrl` 未指定：`/v1/...`（同一オリジン）
- `baseUrl` 指定：`{baseUrl}/v1/...`

### 共通ヘッダ
- Request: `Content-Type: application/json`
- Response: `Content-Type: application/json`

### 共通エラーフォーマット
HTTP 4xx/5xx のとき、本文の `error` または `message` を UI が優先表示する。

**例**
```json
{
  "error": "INVALID_REQUEST",
  "message": "settings.tone must be one of neutral/casual/formal/technical"
}


---

1) POST /v1/checks

Markdown本文 + 設定を受け取り、checkId と report を返す。

Request

{
  "text": "string (markdown)",
  "settings": {
    "publishScope": "public|unlisted|private|internal",
    "tone": "neutral|casual|formal|technical",
    "audience": "engineers|general|internal|executives",
    "redactMode": "none|light|strict"
  },
  "config": {
    "mock": "auto|on|off"
  }
}

Response（例）

{
  "checkId": "chk_01JAX2Q9Z3V6KQK2",
  "report": {
    "verdict": "warn",
    "score": 72,
    "summary": {
      "totalFindings": 4,
      "bySeverity": { "low": 1, "medium": 2, "high": 1, "critical": 0 },
      "byCategory": { "privacy": 2, "security": 1, "legal": 1 }
    },
    "findings": [
      {
        "id": "f_001",
        "category": "privacy",
        "severity": "high",
        "title": "個人情報の具体性が高い",
        "reason": "氏名と所属を併記しているため、個人特定の可能性が高い。",
        "suggestion": "氏名を伏せ、所属は業界カテゴリに置換する。",
        "ranges": [
          { "start": 120, "end": 145, "context": "..." }
        ],
        "tags": ["pii", "identification"]
      },
      {
        "id": "f_002",
        "category": "security",
        "severity": "medium",
        "title": "内部URLの公開",
        "reason": "社内ホスト名が含まれている。",
        "suggestion": "ドメインを example.com に置換する。",
        "ranges": [{ "start": 310, "end": 342, "context": "..." }]
      }
    ],
    "highlights": {
      "mode": "ranges",
      "items": [
        { "findingId": "f_001", "start": 120, "end": 145 },
        { "findingId": "f_002", "start": 310, "end": 342 }
      ]
    }
  }
}


---

2) POST /v1/checks/{checkId}/recheck

既存 checkId に対して、本文（修正後）を再評価する。

Request

{
  "text": "string (markdown)",
  "settings": {
    "publishScope": "public|unlisted|private|internal",
    "tone": "neutral|casual|formal|technical",
    "audience": "engineers|general|internal|executives",
    "redactMode": "none|light|strict"
  }
}

Response（例）

{
  "checkId": "chk_01JAX2Q9Z3V6KQK2",
  "report": {
    "verdict": "ok",
    "score": 92,
    "summary": {
      "totalFindings": 0,
      "bySeverity": { "low": 0, "medium": 0, "high": 0, "critical": 0 },
      "byCategory": {}
    },
    "findings": [],
    "highlights": { "mode": "ranges", "items": [] }
  }
}


---

3) POST /v1/patches

指摘（finding）に対して before/after を返す（Patch Preview 用）。

Request（最小）

{
  "checkId": "chk_...",
  "findingId": "f_001",
  "text": "string (current markdown)"
}

Response（例）

{
  "patchId": "ptc_01JAX2R4M8Z0",
  "findingId": "f_001",
  "before": "氏名：田中 太郎（TOPPAN）",
  "after": "氏名：（非公開）（製造業）",
  "range": { "start": 120, "end": 145 },
  "apply": {
    "mode": "replaceRange",
    "start": 120,
    "end": 145,
    "replacement": "氏名：（非公開）（製造業）"
  }
}


---

4) POST /v1/release

report.verdict === "ok" のときのみ成功する想定。
安全版Markdown / 修正サマリ / 公開前チェックリストを返す（Copy群用）。

Request

{
  "checkId": "chk_...",
  "text": "string (final markdown)",
  "settings": {
    "publishScope": "public|unlisted|private|internal",
    "tone": "neutral|casual|formal|technical",
    "audience": "engineers|general|internal|executives",
    "redactMode": "none|light|strict"
  }
}

Response（例）

{
  "releaseId": "rel_01JAX2S8TQ1P",
  "verdict": "ok",
  "safeMarkdown": "# タイトル\n\n本文（安全化済み）...\n",
  "fixSummary": [
    "個人名を匿名化した。",
    "社内URLを example.com に置換した。"
  ],
  "checklist": [
    "社外秘情報が含まれていない。",
    "個人情報（氏名/メール/住所）が匿名化されている。",
    "認証情報（APIキー/トークン）が含まれていない。"
  ],
  "publishedScope": "unlisted"
}


---

5) POST /v1/persona-review（任意）

右タブ「ペルソナレビュー」用。ペルソナ別の観点でレビュー結果を返す。

Request

{
  "persona": "frontend|security|legal|general",
  "text": "string (markdown)",
  "settings": {
    "publishScope": "public|unlisted|private|internal",
    "tone": "neutral|casual|formal|technical",
    "audience": "engineers|general|internal|executives",
    "redactMode": "none|light|strict"
  }
}

Response（例）

{
  "persona": "security",
  "verdict": "warn",
  "summary": {
    "total": 3,
    "bySeverity": { "low": 1, "medium": 2, "high": 0, "critical": 0 }
  },
  "items": [
    {
      "id": "p_001",
      "severity": "medium",
      "title": "鍵情報の記載に注意",
      "reason": "環境変数名と取得手順が具体的で、誤って値を貼る誘発になる。",
      "suggestion": "値は絶対に貼らない注意書きを追加する。",
      "ranges": [{ "start": 520, "end": 610, "context": "..." }]
    },
    {
      "id": "p_002",
      "severity": "low",
      "title": "権限設定の説明不足",
      "reason": "最小権限の原則への言及がない。",
      "suggestion": "必要権限の範囲を明記する。",
      "ranges": [{ "start": 700, "end": 760, "context": "..." }]
    }
  ]
}


---

UI側が使いやすい推奨値

severity

low | medium | high | critical


category（例）

privacy | security | legal | compliance | safety | reputation | quality



---
