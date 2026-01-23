(.venv) PS C:\Users\toppa\Documents\Dev\AI_Agents_Hackson\backend> python test.py --base-url http://localhost:8000 --md sample_blog.md --mock off
=== 0) Input markdown length: 3641

=== 1) POST /v1/checks
{
  "checkId": "chk_d5fcf0ea9c9e492b",
  "verdict": "bad"
}

=== 2) POST /v1/persona-review
{
  "persona": "security",
  "verdict": "bad",
  "total": 16
}

=== 3) POST /v1/patches (for each finding) + apply locally
{
  "findingId": "pii-name-001",
  "beforePreview": "田中 太郎",
  "afterPreview": "T.T."
}
{
  "findingId": "pii-email-001",
  "beforePreview": "tanaka.taro@toppan.example.jp",
  "afterPreview": "dummy.user@example.com"
}
{
  "findingId": "pii-slack-001",
  "beforePreview": "@taro_tanaka",
  "afterPreview": "@user_id"
}
{
  "findingId": "sec-projid-001",
  "beforePreview": "toppan-internal-dev-123",
  "afterPreview": "your-gcp-project-id"
}
{
  "findingId": "sec-url-001",
  "beforePreview": "http://intra-admin.toppan.local:8080/",
  "afterPreview": "http://internal.example.com/admin"
}
{
  "findingId": "sec-url-002",
  "beforePreview": "https://jira.toppan.local/browse/PROJ-123",
  "afterPreview": "https://jira.example.com/browse/PROJ-XXX"
}
{
  "findingId": "sec-ip-001",
  "beforePreview": "http://10.20.30.40:9000/swagger",
  "afterPreview": "http://api.example.com/docs/swagger"
}
{
  "findingId": "sec-api-url-001",
  "beforePreview": "http://intra-api.toppan.local/v1/checks",
  "afterPreview": "http://api.example.com/v1/checks"
}
{
  "findingId": "sec-apikey-001",
  "beforePreview": "sk-THIS_IS_NOT_REAL_BUT_LOOKS_LIKE_A_KEY",
  "afterPreview": "DUMMY_API_KEY"
}
{
  "findingId": "sec-token-001",
  "beforePreview": "hf_abcdefghijklmnopqrstuvwxyz0123456789",
  "afterPreview": "YOUR_HF_TOKEN"
}
{
  "findingId": "sec-awskey-001",
  "beforePreview": "AKIAIOSFODNN7EXAMPLE",
  "afterPreview": "YOUR_AWS_ACCESS_KEY_ID"
}
{
  "findingId": "sec-awskey-002",
  "beforePreview": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "afterPreview": "DUMMY_AWS_SECRET_ACCESS_KEY"
}
{
  "findingId": "sec-password-001",
  "beforePreview": "SuperSecretPassword123",
  "afterPreview": "DUMMY_ADMIN_PASSWORD"
}
{
  "findingId": "sec-cors-001",
  "beforePreview": "CORSを広く許可しています（本番では不可）",
  "afterPreview": "CORSを広く許可しています（本番環境では重大なセキュリティリスクとなります）"
}
{
  "findingId": "sec-auth-001",
  "beforePreview": "認証が無いので、誰でも /v1/checks を叩けます。",
  "afterPreview": "認証が無いので、誰でも /v1/checks を叩けます。（**本番環境では認証を必ず導入してください**）"
}

=== 4) POST /v1/checks/{checkId}/recheck
{
  "checkId": "chk_d5fcf0ea9c9e492b",
  "verdict": "bad",
  "score": 5,
  "totalFindings": 20
}

=== 5) POST /v1/release (only if verdict==ok)
[info] verdict is not ok. skip release.