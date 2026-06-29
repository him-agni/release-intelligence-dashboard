# Release Intelligence Dashboard

A portfolio-grade Solutions Engineering project that turns deployment events into a unified release health snapshot.

<img width="1482" height="810" alt="image" src="https://github.com/user-attachments/assets/5515a1e4-8ba3-4b78-a74a-055d049d094c" />

Live link: https://release-intelligence-dashboard.vercel.app

## What It Does

After a GitHub Actions deployment, the backend collects signals from observability and product analytics tools, computes a health score, stores a deployment snapshot, and shows the result in a React dashboard.

Initial development uses `DATA_MODE=mock` so the full product experience works without external credentials. The service layer is shaped for live GitHub, Sentry, PostHog, and GCP Logging integrations.

## Planned Flow

```txt
GitHub Actions deployment completes
  -> POST /webhooks/github
  -> fetch Sentry, PostHog, GCP Logging, GitHub Actions in parallel
  -> compute health score and recommendation
  -> store MongoDB deployment snapshot
  -> display in dashboard
```

## Quick Start

```bash
npm install
npm run dev:server
npm run dev:client
```

Server: `http://localhost:5050`  
Client: `http://localhost:5173`

## Current MVP

- Interactive React dashboard with a deployment timeline
- Manual deployment simulation with `healthy`, `watch`, and `incident` scenarios
- Express webhook endpoint at `POST /webhooks/github`
- Parallel signal aggregation with graceful degradation
- Mock Sentry, PostHog, GCP Logging, and GitHub Actions adapters
- Health score, health status, recommendation, and release summary generation
- In-memory demo store when MongoDB is unavailable
- MongoDB persistence when `MONGODB_URI` is configured
- Reset action for repeatable testing

## Core Talking Points

- Webhook ingestion and signature verification
- Parallel API aggregation with graceful degradation
- Configurable health scoring model
- Before/after deployment analysis
- Mock/live service boundary for demo reliability
- Release-owner recommendation engine

## Demo Script

Use this flow for an interview or portfolio walkthrough.

1. Start with the problem:

```txt
After a deployment, teams usually check GitHub Actions, Sentry, product analytics, and cloud logs in separate tabs. This dashboard turns those signals into one release health snapshot.
```

2. Show the architecture:

```txt
GitHub workflow_run webhook -> Express API -> parallel service fetches -> MongoDB snapshot -> React dashboard
```

3. Run the app:

```bash
npm run check-env
npm run dev:server
npm run dev:client
```

4. Open the dashboard:

```txt
http://localhost:5173
```

5. Trigger the real workflow:

```txt
GitHub repo -> Actions -> Release Demo -> Run workflow
```

6. Refresh the dashboard after the workflow completes and open the newest deployment.

7. Explain the panels:

```txt
GitHub Actions shows workflow status and failed jobs.
Sentry shows new unresolved issues in the deploy window.
PostHog shows product usage and exception events.
GCP Logs shows warning/error/critical log counts.
The health score turns those signals into a release-owner recommendation.
```

8. Call out reliability details:

```txt
Webhook signatures use the raw request body.
Async route errors go through central error middleware.
Each integration is isolated with Promise.allSettled, so one failing vendor does not block the whole snapshot.
Snapshots are persisted in MongoDB and deduped by workflow run ID.
```

9. Clarify zero values:

```txt
Zero does not mean fake data. In live mode, zero means the service was queried successfully but had no matching activity in the post-deploy window.
```

## Live Integration Status

The app is complete for mock-mode testing and portfolio demos. Live adapters exist for GitHub Actions jobs, Sentry project issues, PostHog HogQL event counts, and GCP Logging severity counts. See `docs/LIVE_INTEGRATIONS.md`.

## Deployment

The app can deploy to Vercel as a single project that serves both the React dashboard and Express backend. See `docs/VERCEL_DEPLOYMENT.md`.
