# python test.py --base-url http://localhost:8000 --md sample_blog.md --mock off の結果　

=== 0) Input markdown length: 3641

=== 1) POST /v1/checks
{
  "checkId": "chk_782f9d9eadcf457c",
  "verdict": "bad"
}

=== 2) POST /v1/persona-review
{
  "persona": "security",
  "verdict": "bad",
  "total": 18
}

=== 3) POST /v1/patches (for each finding) + apply locally
{
  "findingId": "F1",
  "beforePreview": "【社内向け検証】",
  "afterPreview": ""
}
{
  "findingId": "F2",
  "beforePreview": "規事業開発",
  "afterPreview": "[所属]"
}
{
  "findingId": "F3",
  "beforePreview": "ython 3.12 /",
  "afterPreview": ""
}
{
  "findingId": "F4",
  "beforePreview": "CLOUD_LOCATION=\"us-ce",
  "afterPreview": "your-project-id"
}
{
  "findingId": "F5",
  "beforePreview": "h\"\n\nuvicor",
  "afterPreview": "your-region"
}
{
  "findingId": "F6",
  "beforePreview": "0\n````\n\n---\n\n##",
  "afterPreview": "your-model-name"
}
{
  "findingId": "F7",
  "beforePreview": "は [tanaka.taro@toppan.example.jp](mailto:tanaka.taro@toppan.example.j",
  "afterPreview": "[dummy@example.com](mailto:dummy@example.com)"
}
{
  "findingId": "F8",
  "beforePreview": "p) です。\nSlac",
  "afterPreview": "@dummy_user"
}
{
  "findingId": "F9",
  "beforePreview": "-admin.toppan.local:8080/](http://i",
  "afterPreview": "http://example.com/admin"
}
{
  "findingId": "F10",
  "beforePreview": "local:8080/)\n* [https://jira.toppan.local",
  "afterPreview": "https://example.com/jira/browse/PROJ-XXX"
}
{
  "findingId": "F11",
  "beforePreview": "PROJ-123](https://jira.toppan.l",
  "afterPreview": "http://example.com/api-docs"
}
{
  "findingId": "F12",
  "beforePreview": ".40:9000/swagger](http://10.20.30.40:",
  "afterPreview": "POST http://api.example.com/v1/checks 200"
}
{
  "findingId": "F13",
  "beforePreview": "\n\nログ例:\n\n`",
  "afterPreview": "req_xxxxxxxx"
}
{
  "findingId": "F14",
  "beforePreview": "見たいです。\n\n```bash\nexport OPENAI_API_KEY=\"",
  "afterPreview": "YOUR_OPENAI_API_KEY"
}
{
  "findingId": "F15",
  "beforePreview": "_TOKEN=\"hf_abcdefghijklmnopqrstuvwxyz01",
  "afterPreview": "YOUR_HF_TOKEN"
}
{
  "findingId": "F16",
  "beforePreview": "t AWS_SECRET_ACCESS_",
  "afterPreview": "YOUR_AWS_ACCESS_KEY_ID"
}
{
  "findingId": "F17",
  "beforePreview": "KEY\"\n```\n\n`.env` 例:\n\n```env\nGOOGLE_CLOUD_",
  "afterPreview": "export AWS_SECRET_ACCESS_KEY=\"YOUR_AWS_SECRET_ACCESS_KEY\""
}
{
  "findingId": "F18",
  "beforePreview": "ssword123\n```\n\n### 4.4",
  "afterPreview": "YOUR_ADMIN_PASSWORD"
}
{
  "findingId": "F19",
  "beforePreview": "可）\n```\n\nまた、認証が無いので、",
  "afterPreview": "allow_origins=[\"https://your-domain.com\"]"
}
{
  "findingId": "F20",
  "beforePreview": "を叩けます。\n本番は IAP や API Gateway の認証を入れ",
  "afterPreview": "このAPIは検証のため認証がありませんが、本番環境では認証機能が必須です。誰でも /v1/checks を叩けます。"
}
{
  "findingId": "F21",
  "beforePreview": "on\" \\\n  -d '{\n    \"checkId\": \"chk",
  "afterPreview": "第三者の機密情報は含めません（含めてはいけません）。公開前に、機密情報が含まれていないか最終確認してください。"
}
{
  "findingId": "F22",
  "beforePreview": "か最終確認してください。_xxxxxxxxxxxxxxxx\",",
  "afterPreview": "ライセンス未確認のコードをコピーして公開しません。公開前に、実際にライセンスに問題がないか最終確認してください。"
}
{
  "findingId": "F23",
  "beforePreview": "がないか最終確認してください。\n    \"text\": \"（修正後Mar",
  "afterPreview": "企業名・製品名の扱いは、各社の商標ガイドラインに従います。公開前に、実際に商標ガイドラインに沿っているか最終確認してください。"
}

=== 4) POST /v1/checks/{checkId}/recheck
{
  "checkId": "chk_782f9d9eadcf457c",
  "verdict": "bad",
  "score": 20,
  "totalFindings": 22
}

=== 5) POST /v1/release (only if verdict==ok)
[info] verdict is not ok. skip release.