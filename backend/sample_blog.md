# 【社内向け検証】Blog Risk Checker API（Gemini/Vertex AI）を動かしてみた

本稿は、技術ブログ公開前チェック用API（FastAPI + Gemini structured output）を、社内で試した記録です。  
公開前に「個人情報」「セキュリティ」「法務/コンプライアンス」を機械レビューします。

---

## 1. 検証環境

- 作業者: 田中 太郎（TOPPAN / 新規事業開発）
- 端末: MacBook Pro
- 実行環境: Python 3.12 / FastAPI / Uvicorn
- モデル: gemini-2.5-flash（Vertex AI）

---

## 2. APIの起動

以下の環境変数を設定して起動します。

```bash
export GOOGLE_CLOUD_PROJECT="toppan-internal-dev-123"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GEMINI_MODEL="gemini-2.5-flash"

uvicorn main:app --reload --port 8000
````

---

## 3. チェック実行（/v1/checks）

Markdown全文を投げると、指摘（findings）とハイライト（ranges）が返ります。

```bash
curl -s http://localhost:8000/v1/checks \
  -H "Content-Type: application/json" \
  -d '{
    "text": "# サンプル\n\n本文...",
    "settings": {
      "publishScope": "public",
      "tone": "technical",
      "audience": "engineers",
      "redactMode": "light"
    },
    "config": {"mock": "off"}
  }' | jq
```

---

## 4. 社内メモ（公開NG要素をわざと含める）

以下は、検出できるか確認したい要素です。ここは意図的に危ない内容を入れています。

### 4.1 個人情報

私は 田中 太郎 です。所属は TOPPAN の ○○部です。
連絡先は [tanaka.taro@toppan.example.jp](mailto:tanaka.taro@toppan.example.jp) です。
Slack は @taro_tanaka です。

### 4.2 社内URL / 社内ホスト名

社内の管理画面は以下です（外部公開してはいけません）。

* [http://intra-admin.toppan.local:8080/](http://intra-admin.toppan.local:8080/)
* [https://jira.toppan.local/browse/PROJ-123](https://jira.toppan.local/browse/PROJ-123)
* [http://10.20.30.40:9000/swagger](http://10.20.30.40:9000/swagger)

ログ例:

```text
POST http://intra-api.toppan.local/v1/checks 200
x-request-id: req_9d7c...
```

### 4.3 鍵情報・トークン（値の貼り付け誘発）

※以下はダミーですが、形式として検出できるか見たいです。

```bash
export OPENAI_API_KEY="sk-THIS_IS_NOT_REAL_BUT_LOOKS_LIKE_A_KEY"
export HF_TOKEN="hf_abcdefghijklmnopqrstuvwxyz0123456789"
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

`.env` 例:

```env
GOOGLE_CLOUD_PROJECT=toppan-internal-dev-123
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
INTERNAL_ADMIN_PASSWORD=SuperSecretPassword123
```

### 4.4 脆弱な設定例（CORS・認証なし）

このAPIは検証のため、CORSを広く許可しています（本番では不可）。

```python
# 例: allow_origins=["*"] など（本番は不可）
```

また、認証が無いので、誰でも /v1/checks を叩けます。
本番は IAP や API Gateway の認証を入れる必要があります。

---

## 5. パッチ生成（/v1/patches）

UIは `checkId` と `findingId` を指定し、該当レンジを置換する想定です。

```bash
curl -s http://localhost:8000/v1/patches \
  -H "Content-Type: application/json" \
  -d '{
    "checkId": "chk_xxxxxxxxxxxxxxxx",
    "findingId": "f_001",
    "text": "（ここに全文Markdown）",
    "config": {"mock": "off"}
  }' | jq
```

---

## 6. リリース（/v1/release）

保存済みレポートの verdict が `ok` の場合のみ通ります。
この制約はUIの「公開ボタン」の制御と一致します。

```bash
curl -s http://localhost:8000/v1/release \
  -H "Content-Type: application/json" \
  -d '{
    "checkId": "chk_xxxxxxxxxxxxxxxx",
    "text": "（修正後Markdown）",
    "settings": {
      "publishScope": "public",
      "tone": "technical",
      "audience": "engineers",
      "redactMode": "strict"
    },
    "config": {"mock": "off"}
  }' | jq
```

---

## 7. ペルソナレビュー（/v1/persona-review）

同じMarkdownでも、観点別の指摘を出します。

```bash
curl -s http://localhost:8000/v1/persona-review \
  -H "Content-Type: application/json" \
  -d '{
    "persona": "security",
    "text": "（ここに全文Markdown）",
    "settings": {
      "publishScope": "public",
      "tone": "technical",
      "audience": "engineers",
      "redactMode": "light"
    },
    "config": {"mock": "off"}
  }' | jq
```

---

## 8. 法務/コンプライアンスの例（注意喚起テスト）

* この記事は社内検証の記録です。
* 第三者の機密情報は含めません（含めてはいけません）。
* ライセンス未確認のコードをコピーして公開しません。
* 企業名・製品名の扱いは、各社の商標ガイドラインに従います。

---

## 9. まとめ

本稿は、危ない要素を含むMarkdownの例です。
この例を入力として、指摘・パッチ・リリースの一連フローを検証します。