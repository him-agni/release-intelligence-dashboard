# Live Integrations

Use this after mock mode and GitHub webhooks are working.

## 1. Protect Credentials

Never commit `server/.env`. If a token or service account key was pasted into chat, logs, or screenshots, rotate it before continuing.

## 2. Environment

Set:

```env
DATA_MODE=live
```

Then confirm these values exist:

```env
GITHUB_TOKEN=
GITHUB_REPO=owner/repo
GITHUB_WEBHOOK_SECRET=

SENTRY_AUTH_TOKEN=
SENTRY_ORG_SLUG=your-org-slug
SENTRY_PROJECT_SLUG=your-project-slug
SENTRY_PROJECT_SLUGS=demo-saas-app-frontend,demo-saas-app-backend

POSTHOG_API_KEY=
POSTHOG_PROJECT_ID=
POSTHOG_HOST=https://us.posthog.com
POSTHOG_APP_FILTER=acmeops
POSTHOG_MONITORED_PROJECT_FILTER=demo-saas-app

GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=
GCP_PROJECT_ID=
GCP_LOG_NAME=run.googleapis.com%2Fstdout
```

`SENTRY_ORG_SLUG` should be only the slug, not the full Sentry URL.

Use `SENTRY_PROJECT_SLUGS` when one monitored app has multiple Sentry projects. It takes precedence over the single `SENTRY_PROJECT_SLUG` value.

`GOOGLE_SERVICE_ACCOUNT_JSON` must be valid JSON on one line so `dotenv` can parse it reliably. The safer option is `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`, which stores the same JSON encoded as base64.

## 3. Restart

Run the preflight check first:

```bash
npm run check-env
```

```bash
npm run dev:server
npm run dev:client
```

## 4. Trigger A Workflow

Run the GitHub Actions workflow in the repo you are monitoring. The webhook should create one completed deployment snapshot.

## 5. Validate

Open the dashboard and check `Integration Status`.

Expected:

- GitHub should be fulfilled if the token has Actions read permission.
- Sentry should be fulfilled if org/project/token scopes are correct. The dashboard counts unresolved issues recently seen in the release window, which works with repeated AcmeOps demo errors that Sentry groups into existing issues.
- PostHog should be fulfilled, but may show zeros if the project has no events.
- If one PostHog project contains events for multiple apps, set `POSTHOG_APP_FILTER` and `POSTHOG_MONITORED_PROJECT_FILTER` to the monitored app properties. For the demo SaaS app, use `acmeops` and `demo-saas-app`.
- The dashboard counts PostHog exception signals from `$exception`, `demo_frontend_error`, and `demo_backend_error` events.
- GCP Logging should be fulfilled, but may show zeros if there are no logs in the one-hour post-deploy window.

Zeros are valid live data. They are different from mock values.
