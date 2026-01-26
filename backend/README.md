# Blog Risk Checker バックエンド仕様

Google Gemini 2.5 Flash (Vertex AI) を利用して、技術ブログ記事（Markdown）のセキュリティ、プライバシー、およびコンプライアンスリスクを分析・修正支援するバックエンドAPIです。

## プロジェクト概要

技術記事を公開する前に、以下の観点で自動チェックを行います：
- **Check**: 個人情報漏洩、機密情報の記載、不適切な表現の検出
- **Patch**: 指摘箇所に対する修正案の自動生成
- **Recheck**: 修正適用後の再評価
- **Release**: 公開可能な形式への最終整形とチェックリスト生成
- **Persona Review**: 特定の読者層（エンジニア、経営層など）の視点によるレビュー

## 技術スタック

- **言語**: Python 3.x
- **フレームワーク**: FastAPI
- **AIモデル**: Google Gemini 2.5 Flash (via Vertex AI)
- **ライブラリ**: `google-genai`, `pydantic`, `uvicorn`, `python-dotenv`

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```
※ `requirements.txt` がない場合は `fastapi uvicorn google-genai python-dotenv requests` などをインストールしてください。

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の変数を設定してください。

| 変数名 | 説明 | 必須 | デフォルト値 |
|Text|Text|Text|Text|
| `GOOGLE_CLOUD_PROJECT` | Google Cloud プロジェクトID | YES | - |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI リージョン | NO | `us-central1` |
| `GEMINI_MODEL` | 使用するモデルID | NO | `gemini-2.5-flash` |
| `MOCK` | モックモードの強制有効化 (`1` or `true`) | NO | - |

## 実行方法

### 開発サーバーの起動

```bash
uvicorn main:app --reload --port 8000
```

### 動作確認 (テストスクリプト)

同梱の `test.py` を使用して、一連のフローをテストできます。

```bash
# モックモード（API課金なし）で実行
python test.py --base-url http://localhost:8000 --md sample_blog.md --mock on

# 実APIを使用して実行
python test.py --base-url http://localhost:8000 --md sample_blog.md --mock off
```

## API仕様

全てのレスポンスはJSON形式で返却されます。
Geminiとの通信にはStructured Outputs（JSONスキーマ）を使用しており、安定したフォーマットが出力されます。

### 共通設定 (Settings)
各エンドポイントで `settings` オブジェクトを受け取ります。

*   **publishScope**: `public`, `unlisted`, `private`, `internal`
*   **tone**: `neutral`, `casual`, `formal`, `technical`
*   **audience**: `engineers`, `general`, `internal`, `executives`
*   **redactMode**: `none`, `light`, `strict`

### エンドポイント一覧

#### 1. 初回チェック: `POST /v1/checks`
Markdownテキストを受け取り、リスク分析レポートを返します。
- **Request**: `text`, `settings`
- **Response**: `checkId`, `report` (findings, verdict, score...)

#### 2. 修正案生成: `POST /v1/patches`
特定の指摘 (`findingId`) に対する修正案を生成します。
- **Request**: `checkId`, `findingId`, `text` (現在の全文)
- **Response**: `patchId`, `apply` (originalText, replacement)
- **Note**: クライアント側で文字列置換を行うための正確な `originalText` を返します。

#### 3. 再チェック: `POST /v1/checks/{checkId}/recheck`
修正後のテキストで再評価を行います。
- **Request**: `text` (修正後全文), `settings`
- **Response**: `checkId`, `report`

#### 4. 公開用整形: `POST /v1/release`
評価が `ok` の場合のみ実行可能です。公開用に整形されたMarkdownとチェックリストを返します。
- **Request**: `checkId`, `text`, `settings`
- **Response**: `safeMarkdown`, `fixSummary`, `checklist`

#### 5. ペルソナ/オーディエンスレビュー: `POST /v1/persona-review`
設定された `audience` (旧 persona) の視点で追加レビューを行います。
- **Request**: `text`, `settings`
- **Response**: `audience`, `verdict`, `items` (指摘リスト)
- **Note**: レビューの視点は `settings.audience` の値によって決定されます。

## アーキテクチャ構成

*   `main.py`: アプリケーションの全ロジック（型定義、API定義、Gemini連携）が含まれるシングルファイル構成です。
*   **In-Memory Store**: 簡易的なステート管理として、メモリ上の辞書 `CHECK_STORE` にチェック結果を保持しています（サーバー再起動で消えます）。
*   **Mock Mode**: APIコスト削減と高速な開発のため、`MOCK` 環境変数またはリクエスト内の `config.mock` でモック応答に切り替え可能です。
