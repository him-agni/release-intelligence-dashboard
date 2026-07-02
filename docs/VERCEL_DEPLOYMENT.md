# Vercel Deployment

This project deploys as one Vercel app:

- Vite React dashboard
- Express API
- GitHub webhook endpoint

The production app serves the frontend and backend from the same origin, so the browser calls `/api/deployments` directly.

## 1. Import Project

In Vercel:

1. Add New Project
2. Import `him-agni/release-intelligence-dashboard`
3. Keep the project root as the repository root

Vercel should use:

```txt
Build Command: npm run build
Output Directory: client/dist
```

The Vite frontend is served from `client/dist`. The Express backend runs as a Vercel Function under `api/[...path].js`, with rewrites for `/health` and `/webhooks/*`.

## 2. Environment Variables

Add the same values from `server/.env`, except do not add local-only values like `PORT`.

Required:

```env
DATA_MODE=live
MONGODB_URI=
GITHUB_WEBHOOK_SECRET=
GITHUB_TOKEN=
GITHUB_REPO=
SENTRY_AUTH_TOKEN=
SENTRY_ORG_SLUG=
SENTRY_PROJECT_SLUG=
SENTRY_PROJECT_SLUGS=demo-saas-app-frontend,demo-saas-app-backend
POSTHOG_API_KEY=
POSTHOG_PROJECT_ID=
POSTHOG_HOST=https://us.posthog.com
POSTHOG_APP_FILTER=acmeops
POSTHOG_MONITORED_PROJECT_FILTER=demo-saas-app
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=
GCP_PROJECT_ID=
GCP_LOG_NAME=
```

Optional:

```env
ALLOW_DEPLOYMENT_RESET=true
ALLOW_DEPLOYMENT_SIMULATION=true
```

For a public portfolio deployment, leave simulation/reset disabled unless you want demo controls to work.

## 3. Deploy

Deploy from Vercel. After deployment, open:

```txt
https://your-vercel-app.vercel.app/health
```

Expected:

```json
{
  "ok": true,
  "dataMode": "live",
  "database": "connected"
}
```

## 4. Update GitHub Webhook

In the monitored repo, update the webhook payload URL to:

```txt
https://your-vercel-app.vercel.app/webhooks/github
```

Keep:

```txt
Content type: application/json
Events: Workflow runs
Secret: same as GITHUB_WEBHOOK_SECRET
```

## 5. Test

1. Trigger the monitored repo's GitHub Actions workflow.
2. Wait for it to complete.
3. Open the Vercel dashboard app.
4. Confirm a new deployment appears.
5. Confirm Integration Status rows show fulfilled or actionable vendor errors.
