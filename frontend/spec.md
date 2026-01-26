# Blog Risk Checkerフロントエンド仕様

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
- **View切替**: `Editor` / `Preview` のトグルボタン
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

---

## 4. 左ペイン仕様（Markdown Editor / Preview）

### モード切替
- **Editor**: CodeMirror による Markdown 編集画面（デフォルト）
- **Preview**: `react-markdown` によるレンダリング結果の閲覧

### 4.1 Editorモード


### 表示要素
- 行番号（左ガター）
- Markdownテキスト
- 指摘ハイライト（黄色背景）

### 4.1.2 編集仕様
- プレーンMarkdown入力（MVPは最低限）
- ハイライトは「チェック結果の highlights.items」に基づきテキスト検索でオーバーレイ表示
- カーソル位置とハイライト表示の整合が必要（CodeMirror / Monaco 等を想定）

### 4.1.3 ハイライト仕様
- 種別ごとのスタイル差を許容（基本は黄色）
- クリック時に「該当指摘カード選択」へ同期（任意だが自然）

### 4.2 Previewモード
- **機能**: Markdown記法（太字、リスト、リンク、テーブル等）をスタイル適用して表示する。
- **技術**: `react-markdown` + `remark-gfm` + `@tailwindcss/typography`
- **スタイル**: `prose` (Tailwind Typography) を使用し、読みやすい記事スタイルを提供する。

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
- 選択に連動して左エディタの該当テキスト箇所へスクロールし、強調表示する

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
  - `highlights[]: { text: string, context: string }`
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
  - エディタ側で該当テキスト箇所へスクロールし、強調表示する
- `onClickExport()`
  - `releaseStatus` を "running" に更新
  - `/v1/release` を呼び出し
  - 成功: `releaseResult` を保存、Exportメニューを表示
  - 失敗: エラーメッセージを表示、`releaseStatus` を "error" に更新

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
      - `MarkdownEditor`（行番号 + テキスト一致ハイライト）
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
- `releaseResult: ReleaseResult | null`
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
- 返却の `apply` をエディタに反映する（`replaceText`）。

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
  "apply": {"mode": "replaceText", "originalText": "...", "replacement": "..."}
}
```

#### UI制御

checkId が無い場合：Patch操作はdisabled（MVP）

実行中：該当カードにローディング

成功：エディタに適用 → recheck を促す（自動でも手動でもよい）

失敗：カード内にエラー（message表示）

---

### 14.4 POST /v1/release（最終出力）

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

- report.verdict !== "ok"：Export disabled + tooltip「Verdict must be OK to export」
- 実行中：Export disabled + spinner、`releaseStatus: "running"`
- 成功：`releaseResult` をstateへ保存、Exportメニュー/モーダルを表示、`releaseStatus: "success"`
- 失敗：エラーバナー表示（message表示）、`releaseStatus: "error"`
- 409：「release requires report.verdict === 'ok'」を表示し、再修正を促す

---

### 14.5 POST /v1/persona-review（ペルソナレビュー）

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

## 15. 型定義（TypeScript想定）

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

findings[]: { id, category, severity, title, reason, suggestion, highlights[], tags? }
  - highlights[]: { text, context }

highlights: { mode: "text", items: [{ findingId, text }] }


PersonaReview（/v1/persona-review）

persona

verdict

summary.total

summary.bySeverity

items[]: { id, severity, title, reason, suggestion, highlights[] }
  - highlights[]: { text, context }


ReleaseResult（/v1/release）

releaseId: string

verdict: "ok"

safeMarkdown: string（安全化されたMarkdown本文）

fixSummary: string[]（修正内容のサマリリスト）

checklist: string[]（公開前チェックリスト）

publishedScope: "public"|"unlisted"|"private"|"internal"

---

## 16. Severityフィルタ集約ルール（UI: All / High / Low）

サーバ：low / medium / high / critical
UI：All / High / Low の3段階

High：high または critical

Low：low または medium

All：全件


運用例：

バナー表示は Passed / 3 Warnings 形式とし、verdict=warn のとき summary.totalFindings を warnings として表示する。



---

## 17. ハイライト適用仕様（Editor）

テキスト一致仕様

APIの highlights.items.text は問題箇所の原文テキスト

フロントエンドはテキスト検索（indexOf等）で該当箇所を特定しハイライト表示

同一テキストが複数存在する場合は全てハイライト（または最初の1件のみ）


表示優先

report.highlights.items を描画の正とする（finding.highlightsと重複しても items を優先）


選択連動

selectedFindingId と一致するハイライトを強調（枠線 / 濃い背景）

クリックで該当箇所へスクロールする



---

## 18. 画面の操作フロー（API結合）

### 18.1 Check

1. POST /v1/checks（checkId が無い場合）


2. 成功 → checkId, report をstateへ保存


3. Findingsタブでカード表示、Editorでハイライト表示



### 18.2 Patch → Apply → Recheck

1. 指摘カードのApply → POST /v1/patches


2. apply.replaceText を draftText に反映（originalText を replacement で置換）


3. 再チェック → POST /v1/checks/{checkId}/recheck


4. report 更新 → ハイライト更新



### 18.3 Persona

1. Personaタブ表示 → POST /v1/persona-review


2. items をカード表示（FindingsのUIを流用）



###　18.4 Release

1. report.verdict === "ok" のときだけ POST /v1/release


2. safeMarkdown / fixSummary / checklist を表示


3. ExportメニューでコピーやDLなどの出力を行う（フロント側）


### 18.5 Export メニュー仕様

#### メニュー項目
1. **Copy Markdown** - `safeMarkdown` をクリップボードにコピー
2. **Download Markdown** - `safeMarkdown` を `.md` ファイルとしてダウンロード（ファイル名: `{docTitle}-safe.md`）
3. **Copy Checklist** - `checklist` をクリップボードにコピー（改行区切り）

#### 表示内容（メニュー/モーダル内）
- **Fix Summary**: `fixSummary` の各項目を箇条書きで表示（修正内容の確認用）
- **Checklist**: `checklist` の各項目をチェックボックス付きで表示（公開前確認用）

#### UI挙動
- Exportボタンクリック → `runRelease()` 実行
- 実行中: ボタンにスピナー表示
- 成功時: ドロップダウンメニューまたはモーダルで出力オプションを表示
- コピー成功時: トースト通知「Copied to clipboard」を表示（2秒で自動消去）
- ダウンロード: ブラウザのダウンロード機能を使用

#### 状態管理
- `releaseStatus`: 実行状態の管理
- `releaseResult`: API結果の保存（再利用可能）
- 一度取得した `releaseResult` は `checkId` が変わるまでキャッシュ可能


---

## 19. エラーハンドリング仕様

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

## 20. ReactコンポーネントとAPIの接続点（最小）

CheckButton → createCheck() / recheck()

FindingCard → createPatch(findingId)（checkId 必須）

PersonaTab → personaReview(persona)

ReleaseButton → release()

Backend code

---

Backend

---


requirements.txt

fastapi>=0.110
uvicorn[standard]>=0.27
pydantic>=2.6
google-genai>=0.3
python-dotenv>=1.0

---

Backend code
main.py

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
        "highlights": [
          { "text": "田中 太郎（TOPPAN）", "context": "氏名と所属の併記" }
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
        "highlights": [{ "text": "http://intra-admin.toppan.local:8080/", "context": "社内URL" }]
      }
    ],
    "highlights": {
      "mode": "text",
      "items": [
        { "findingId": "f_001", "text": "田中 太郎（TOPPAN）" },
        { "findingId": "f_002", "text": "http://intra-admin.toppan.local:8080/" }
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
    "highlights": { "mode": "text", "items": [] }
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
  "before": "田中 太郎（TOPPAN）",
  "after": "T.T.（製造業）",
  "apply": {
    "mode": "replaceText",
    "originalText": "田中 太郎（TOPPAN）",
    "replacement": "T.T.（製造業）"
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
      "highlights": [{ "text": "OPENAI_API_KEY=sk-xxx", "context": "APIキー記載" }]
    },
    {
      "id": "p_002",
      "severity": "low",
      "title": "権限設定の説明不足",
      "reason": "最小権限の原則への言及がない。",
      "suggestion": "必要権限の範囲を明記する。",
      "highlights": [{ "text": "IAMロールを付与", "context": "権限設定" }]
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
