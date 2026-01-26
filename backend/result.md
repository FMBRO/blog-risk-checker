=== 0) Input markdown length: 3641

=== 1) POST /v1/checks
{
  "checkId": "chk_baa97dd9741742f7",
  "verdict": "bad"
}

=== 2) POST /v1/persona-review
{
  "audience": "engineers",
  "verdict": "warn",
  "total": 3
}

=== 3) POST /v1/patches (for each finding) + apply locally
{
  "findingId": "PI001",
  "beforePreview": "田中 太郎（TOPPAN / 新規事業開発）",
  "afterPreview": "検証担当者"
}
{
  "findingId": "PI002",
  "beforePreview": "tanaka.taro@toppan.example.jp",
  "afterPreview": "your.email@example.com"
}
{
  "findingId": "SEC001",
  "beforePreview": "toppan-internal-dev-123",
  "afterPreview": "your-project-id"
}
{
  "findingId": "SEC002",
  "beforePreview": "http://intra-admin.toppan.local:8080/",
  "afterPreview": "http://example.com/admin"
}
{
  "findingId": "SEC003",
  "beforePreview": "sk-THIS_IS_NOT_REAL_BUT_LOOKS_LIKE_A_KEY",
  "afterPreview": "YOUR_OPENAI_API_KEY"
}
{
  "findingId": "SEC004",
  "beforePreview": "allow_origins=[\"*\"]",
  "afterPreview": "allow_origins=[\"http://localhost:8000\"]"
}
{
  "findingId": "SEC005",
  "beforePreview": "x-request-id: req_9d7c...",
  "afterPreview": "x-request-id: req_xxxxxxxx"
}
{
  "findingId": "LEG001",
  "beforePreview": "第三者の機密情報は含めません（含めてはいけません）。",
  "afterPreview": "第三者の機密情報は含めてはいけません。"
}

=== 4) POST /v1/checks/{checkId}/recheck
{
  "checkId": "chk_baa97dd9741742f7",
  "verdict": "bad",
  "score": 20,
  "totalFindings": 13
}

=== 5) POST /v1/release (only if verdict==ok)
[info] verdict is not ok. skip release.