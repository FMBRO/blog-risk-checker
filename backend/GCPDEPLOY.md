## Deploy to Cloud Run

$IMAGE = "asia-northeast1-docker.pkg.dev/vertex-ai-gemini-483907/blog-risk-checker-repo/gemini-app-v2:latest"
$PROJECT_ID = "vertex-ai-gemini-483907"
$REGION = "asia-northeast1"

Deploying container to Cloud Run service [gemini-app-v2] in project [vertex-ai-gemini-483907] region [asia-northeast1]
✓ Deploying new service... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
  ✓ Setting IAM Policy...
Done.
Service [gemini-app-v2] revision [gemini-app-v2-00001-n68] has been deployed and is serving 100 percent of traffic.
Service URL: https://gemini-app-v2-968415810930.asia-northeast1.run.app

Deploying container to Cloud Run service [gemini-app-v3] in project [vertex-ai-gemini-483907] region [asia-northeast1]
✓ Deploying new service... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
  ✓ Setting IAM Policy...
Done.
Service [gemini-app-v3] revision [gemini-app-v3-00001-x2w] has been deployed and is serving 100 percent of traffic.
Service URL: https://gemini-app-v3-968415810930.asia-northeast1.run.app