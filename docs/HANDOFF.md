# Release Intelligence Dashboard Handoff

Last reviewed: 2026-07-07

## Project Summary

Release Intelligence Dashboard is a portfolio-grade Solutions Engineering project that turns a completed GitHub Actions deployment into a single release health snapshot.

The app collects deployment-adjacent signals from GitHub Actions, Sentry, PostHog, and GCP Logging, calculates a health score, stores the snapshot, and displays it in a React dashboard.

The project is intentionally demo-friendly:

- `DATA_MODE=mock` gives a full working experience without external credentials.
- `DATA_MODE=live` switches the service layer to real vendor APIs.
- MongoDB is used when available.
- An in-memory demo store is used when MongoDB is not connected.

Live app listed in README:

```txt
https://release-intelligence-dashboard.vercel.app
```

## Repository Layout

```txt
.
├── api/                         # Vercel function entrypoints
│   ├── [...path].js             # Catch-all Express app export
│   └── webhooks/github.js       # Direct GitHub webhook function export
├── client/                      # Vite + React dashboard
│   ├── src/main.jsx             # Entire React app and API calls
│   └── src/styles.css           # Dashboard styling
├── docs/                        # Setup, testing, deployment, live integration docs
├── postman/                     # Postman collection
├── server/                      # Express API and integration layer
│   └── src/
│       ├── app.js               # Express app, middleware, routes, static serving
│       ├── index.js             # Local server entrypoint
│       ├── controllers/         # Deployment and webhook behavior
│       ├── middleware/          # GitHub signature verification
│       ├── models/              # Mongoose Deployment model
│       ├── routes/              # API route definitions
│       ├── scripts/             # Seed and env preflight scripts
│       ├── services/            # Mock/live vendor adapters
│       ├── store/               # In-memory demo deployment store
│       └── utils/               # Health scoring and async wrapper
├── .env.example                 # Environment variable template
├── package.json                 # Workspace scripts
├── start.js                     # Root local/production Node entrypoint
└── vercel.json                  # Vercel build/route config
```

## Tech Stack

- Frontend: React 19, Vite, lucide-react
- Backend: Node.js ESM, Express 4
- Database: MongoDB via Mongoose 8
- Deployment target: Vercel
- Integrations: GitHub Actions API, Sentry API, PostHog HogQL API, GCP Logging API

## How To Run Locally

Install dependencies:

```bash
npm install
```

Create local environment:

```bash
copy .env.example server\.env
```

For demo mode, keep:

```env
DATA_MODE=mock
```

Start backend and frontend in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

Open:

```txt
http://localhost:5173
```

Important port note:

- `start.js` defaults to port `5050`.
- `client/src/main.jsx` defaults API calls to `http://localhost:5050` in development.
- `server/src/index.js` defaults to port `5000`.
- The docs say API is usually `5050`, but `npm run dev:server` uses `server/src/index.js`, so set `PORT=5050` in `server/.env` or update the server default to avoid confusion.

## Main Scripts

Root scripts:

```txt
npm run dev          # Runs server and client together through concurrently
npm run dev:server   # Starts server workspace with nodemon
npm run dev:client   # Starts Vite client
npm run build        # Builds client only
npm start            # Runs root start.js
npm run seed         # Seeds MongoDB/demo data from server script
npm run check-env    # Validates live integration environment variables
```

Server scripts:

```txt
npm run dev --workspace server
npm run start --workspace server
npm run seed --workspace server
npm run check-env --workspace server
```

Client scripts:

```txt
npm run dev --workspace client
npm run build --workspace client
npm run preview --workspace client
```

There is no automated test script currently.

## Runtime Modes

### Mock Mode

`DATA_MODE=mock`

Behavior:

- GitHub webhook signatures are skipped.
- Mock adapters return deterministic scenario data.
- Dashboard simulation works with `healthy`, `watch`, and `incident`.
- MongoDB is optional.
- If MongoDB is not connected, the app uses `server/src/store/demoDeploymentStore.js`.

### Live Mode

`DATA_MODE=live`

Behavior:

- GitHub webhook signatures are required when `GITHUB_WEBHOOK_SECRET` is set.
- `/api/deployments`, `/webhooks`, and `/api/webhooks` require a live MongoDB connection.
- Services call real GitHub, Sentry, PostHog, and GCP APIs.
- Each integration is isolated with `Promise.allSettled`; a failed vendor falls back to default zero-ish signals and records a rejected integration status.

## Environment Variables

Core:

```env
DATA_MODE=mock
PORT=5050
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
MONGODB_URI=mongodb://127.0.0.1:27017/release-intelligence
```

GitHub:

```env
GITHUB_WEBHOOK_SECRET=
GITHUB_TOKEN=
GITHUB_REPO=owner/repo
```

Sentry:

```env
SENTRY_AUTH_TOKEN=
SENTRY_ORG_SLUG=
SENTRY_PROJECT_SLUG=
SENTRY_PROJECT_SLUGS=
```

PostHog:

```env
POSTHOG_API_KEY=
POSTHOG_PROJECT_ID=
POSTHOG_HOST=https://us.posthog.com
POSTHOG_APP_FILTER=
POSTHOG_MONITORED_PROJECT_FILTER=
```

GCP:

```env
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=
GCP_PROJECT_ID=
GCP_LOG_NAME=
```

Production-only optional controls:

```env
ALLOW_DEPLOYMENT_RESET=true
ALLOW_DEPLOYMENT_SIMULATION=true
```

Leave these unset for a public portfolio deployment unless demo controls should work in production.

## Request Flow

Normal live flow:

```txt
GitHub workflow_run completed
  -> POST /webhooks/github
  -> verify GitHub signature
  -> normalize workflow payload
  -> fetch Sentry, PostHog, GCP Logging, and GitHub signals in parallel
  -> calculate health score
  -> generate status, recommendation, and summary
  -> upsert deployment snapshot by deploymentId
  -> dashboard reads GET /api/deployments
```

Manual demo flow:

```txt
Dashboard Simulate Deployment button
  -> POST /api/deployments/simulate
  -> same controller path as GitHub webhook
  -> mock services return selected scenario
  -> dashboard prepends returned snapshot
```

## API Endpoints

Health:

```txt
GET /health
GET /api/health
```

Deployments:

```txt
GET  /api/deployments
GET  /api/deployments/:id
POST /api/deployments/reset
POST /api/deployments/simulate
```

Webhooks:

```txt
POST /webhooks/github
POST /api/webhooks/github
```

Vercel also exposes:

```txt
api/[...path].js
api/webhooks/github.js
```

## Data Model

The `Deployment` model stores:

- Deployment identity: `deploymentId`, `repository`, `branch`, `commit`
- Workflow metadata: `workflowName`, `workflowStatus`, `workflowDuration`, `triggeredBy`, `deployedAt`
- Sentry signals: `newIssues`, `errorRate`, `releaseHealth`
- PostHog signals: `sessionCount`, `errorEvents`, `activeUsers`, `eventDeltaPercent`
- GCP signals: `errorCount`, `warningCount`, `criticalCount`
- GitHub signals: `runConclusion`, `runUrl`, `jobsFailed`
- Derived values: `healthScore`, `healthStatus`, `recommendation`, `summary`
- Integration status rows: `signalStatuses`

Snapshots are upserted by `deploymentId`, which maps to the GitHub workflow run ID when present.

## Health Scoring

Scoring starts at 100 and subtracts penalties:

- GitHub workflow failure: `-35`
- Failed GitHub jobs: `-15`
- Sentry new issues over 5: `-20`
- Sentry new issues over 10: additional `-10`
- Sentry degraded health: `-15`
- Sentry crashed health: `-40`
- Sentry error rate over 25: `-10`
- GCP critical logs: `-25`
- GCP error logs over 10: `-10`
- GCP warnings over 25: `-5`
- PostHog error events over 20: `-10`
- PostHog event delta below `-30%`: `-10`

Status bands:

```txt
85-100  green
65-84   amber
0-64    red
```

Recommendations:

- `rollback candidate` when workflow failed, GCP has critical logs, or Sentry release health crashed
- `investigate` when score is below 65
- `monitor` when score is below 85
- `ship confidently` otherwise

## Frontend Behavior

The whole React app currently lives in `client/src/main.jsx`.

Main UI features:

- Deployment timeline
- Selected deployment summary
- Health score badge
- Recommendation strip
- Sentry, PostHog, GCP Logs, and GitHub Actions signal panels
- Integration status panel
- Scenario selector: `healthy`, `watch`, `incident`
- Simulate deployment
- Refresh deployments
- Reset deployment list

API base URL:

```js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5050');
```

In production, frontend calls same-origin `/api/deployments`.

## Live Integration Details

GitHub:

- Uses `GITHUB_TOKEN`.
- Parses `owner/repo`.
- Fetches workflow jobs from:

```txt
https://api.github.com/repos/:owner/:repo/actions/runs/:runId/jobs?per_page=100
```

Sentry:

- Requires token, org slug, and one or more project slugs.
- `SENTRY_PROJECT_SLUGS` takes precedence over `SENTRY_PROJECT_SLUG`.
- Counts unresolved issues first seen after the start of the deploy analysis window.

PostHog:

- Uses HogQL through `/api/projects/:projectId/query/`.
- Counts sessions, active users, exception events, and event volume delta.
- Optional filters narrow counts by `properties.app` and `properties.monitored_project`.

GCP Logging:

- Uses service account JSON or base64 service account JSON.
- Counts `WARNING`, `ERROR`, and `CRITICAL` logs.
- Requires `GCP_PROJECT_ID` and `GCP_LOG_NAME`.

Analysis window:

- `getTimeWindow()` currently uses the one hour before `deployedAt` as the current window.
- It also calculates the previous hour before that for PostHog delta.
- This may be counterintuitive because product language says post-deploy monitoring, but code currently looks backward from `deployedAt`.

## Deployment Notes

Vercel deployment is intended to be one project:

- Build command: `npm run build`
- Output directory: `client/dist`
- Express backend served through Vercel functions in `api/`
- Frontend and backend share the same production origin

After deploy:

```txt
GET https://your-app.vercel.app/health
```

Expected live response:

```json
{
  "ok": true,
  "dataMode": "live",
  "database": "connected"
}
```

GitHub webhook payload URL:

```txt
https://your-app.vercel.app/webhooks/github
```

Webhook settings:

```txt
Content type: application/json
Events: Workflow runs
Secret: same as GITHUB_WEBHOOK_SECRET
```

## Testing Checklist

Manual dashboard test:

1. Start server and client.
2. Confirm demo deployments load.
3. Simulate `healthy`; expect green status.
4. Simulate `watch`; expect amber or degraded recommendation.
5. Simulate `incident`; expect red status and `rollback candidate`.
6. Click older timeline items and verify details update.
7. Click reset and verify default demo snapshots return.

API smoke tests:

```bash
curl http://localhost:5050/health
curl http://localhost:5050/api/deployments
curl -X POST http://localhost:5050/api/deployments/reset
```

Simulated webhook:

```bash
curl -X POST http://localhost:5050/webhooks/github ^
  -H "Content-Type: application/json" ^
  -d "{\"simulation\":{\"scenario\":\"incident\"},\"workflow_run\":{\"id\":\"manual-curl-1\",\"name\":\"Deploy Production\",\"status\":\"completed\",\"conclusion\":\"failure\",\"created_at\":\"2026-06-23T20:00:00.000Z\",\"updated_at\":\"2026-06-23T20:04:00.000Z\",\"head_branch\":\"main\",\"head_sha\":\"abc1234\",\"triggering_actor\":{\"login\":\"himani\"}},\"repository\":{\"full_name\":\"himani/ai-code-review-bot\"}}"
```

No automated unit, integration, or end-to-end tests are currently defined.

## Known Issues And Risks

- Port mismatch: `server/src/index.js` defaults to `5000`, while root `start.js`, docs, and frontend default to `5050`.
- `api/[...path].js` and `api/webhooks/github.js` both export the same Express app path for webhooks, which may be redundant on Vercel.
- Production simulation/reset controls still appear in the UI even when production API rejects them unless the allow flags are set.
- Health scoring has no automated tests, even though it is core product logic.
- Live analysis window appears to look at the hour before `deployedAt`, while project messaging says after deployment.
- `Deployment.deploymentId` is indexed but not unique in the schema. Upsert behavior prevents duplicates in the main controller path, but uniqueness is not enforced at the database level.
- `fetchJson()` assumes every non-empty response body is valid JSON.
- If one vendor fails, fallback default values can make the score look healthier than reality; the integration status panel is the only visible warning.
- Demo seed data includes summaries that say green "due to" minor issues, which can read slightly odd in a polished demo.
- Client code is concentrated in one file. That is fine for MVP, but splitting API helpers/components would help if the app grows.

## Suggested Next Improvements

1. Align local API port defaults around `5050` or update docs/client to use `5000`.
2. Add focused tests for `calculateHealthScore()`, `getRecommendation()`, and webhook normalization.
3. Decide whether the live monitoring window should be before, after, or around deployment time.
4. Hide or disable simulation/reset controls in production unless explicitly enabled.
5. Add a unique index for `deploymentId`.
6. Add a lightweight API health/status panel for failed integrations so vendor failures cannot be mistaken for clean releases.
7. Split `client/src/main.jsx` into API helpers and presentational components when adding new UI.

## Questions For The Project Owner

1. Should the live signal window measure the hour after deployment, the hour before deployment, or a before/after comparison?
2. Should failed integrations reduce the health score, or should they only appear in Integration Status?
3. Is this intended primarily as a portfolio demo, a real internal tool, or both?
4. Should public production keep Simulate and Reset visible, hidden, or gated behind an admin/demo mode?
5. Which repository is the canonical monitored demo repo: `himani/ai-code-review-bot`, `demo-saas-app`, or another repo?
6. Should Sentry and PostHog map to one app, multiple services, or frontend/backend separately?
7. What counts as a rollback-worthy signal in a real customer story: workflow failure, critical logs, crashed Sentry health, product drop, or a weighted combination?
8. Should MongoDB be mandatory in all deployed environments, including mock mode, or is the in-memory fallback a deliberate feature?
9. Do you want a historical trend view across deployments, or is the product meant to focus only on the latest release decision?
10. Should the dashboard include links out to the exact GitHub run, Sentry issue query, PostHog query, and GCP log query?
11. Who is the main audience for the demo: recruiter, hiring manager, solutions engineer panel, or technical customer?
12. What is the desired final story: "release health dashboard", "incident prevention cockpit", or "post-deploy customer impact analyzer"?

## Fast Orientation For A Future Engineer

Start here:

1. Read `README.md`.
2. Run in mock mode.
3. Open `server/src/controllers/githubWebhookController.js`.
4. Open `server/src/utils/healthScore.js`.
5. Open `client/src/main.jsx`.
6. Read `docs/LIVE_INTEGRATIONS.md` before touching live API behavior.

The core product loop is only a few files:

```txt
client/src/main.jsx
server/src/app.js
server/src/controllers/githubWebhookController.js
server/src/services/serviceRegistry.js
server/src/services/mock/*
server/src/services/live/*
server/src/utils/healthScore.js
server/src/models/Deployment.js
```

