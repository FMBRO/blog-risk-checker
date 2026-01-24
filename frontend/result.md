=== 0) Input markdown length: 3641

=== 1) POST /v1/checks
{
  "checkId": "chk_3800c48ef0334aab",
  "verdict": "bad"
}

=== 2) POST /v1/persona-review
{
  "audience": "engineers",
  "verdict": "ok",
  "total": 1
}

=== 3) POST /v1/patches (for each finding) + apply locally
{
  "findingId": "f001",
  "beforePreview": "田中 太郎（TOPPAN / 新規事業開発）",
  "afterPreview": "T.T.（TOPPAN / 新規事業開発）"
}
{
  "findingId": "f002",
  "beforePreview": "toppan-internal-dev-123",
  "afterPreview": "YOUR_PROJECT_ID"
}
{
  "findingId": "f003",
  "beforePreview": "http://intra-admin.toppan.local:8080/",
  "afterPreview": "[REDACTED_INTERNAL_URL]"
}
{
  "findingId": "f004",
  "beforePreview": "sk-THIS_IS_NOT_REAL_BUT_LOOKS_LIKE_A_KEY",
  "afterPreview": "YOUR_OPENAI_API_KEY"
}
{
  "findingId": "f005",
  "beforePreview": "x-request-id: req_9d7c...",
  "afterPreview": "x-request-id: [REDACTED_REQUEST_ID]"
}
{
  "findingId": "f006",
  "beforePreview": "allow_origins=[\"*\"]",
  "afterPreview": "allow_origins=[\"*\"] # 危険: 本番環境では絶対に使用しないでください"
}
{
  "findingId": "f007",
  "beforePreview": "認証が無いので、誰でも /v1/checks を叩けます。",
  "afterPreview": "本APIは検証目的のため認証機構がありません。本番環境ではセキュリ ティ上の重大な問題となるため、この設定は絶対に使用せず、適切な認証・認可機構を導入 してください"
}
{
  "findingId": "f008",
  "beforePreview": "第三者の機密情報は含めません（含めてはいけません）。",
  "afterPreview": "第三者の機密情報は含まれていません。"
}
{
  "findingId": "f009",
  "beforePreview": "ライセンス未確認のコードをコピーして公開しません。",
  "afterPreview": "記事内で使用するコードのライセンスは必ず確認し、適切に表示します。"
}
{
  "findingId": "f010",
  "beforePreview": "企業名・製品名の扱いは、各社の商標ガイドラインに従います。",   
  "afterPreview": "記事内で言及する企業名・製品名は、各社の商標ガイドラインを遵守していることを確認済みです。"
}

=== 4) POST /v1/checks/{checkId}/recheck
{
  "checkId": "chk_3800c48ef0334aab",
  "verdict": "bad",
  "score": 10,
  "totalFindings": 15
}

=== 5) POST /v1/release (only if verdict==ok)
[info] verdict is not ok. skip release.