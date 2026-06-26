# Demo Script

## Opening

After every deployment, engineering teams want to know whether the release is healthy. The problem is that the answer is spread across multiple tools: GitHub Actions, Sentry, product analytics, and infrastructure logs.

This dashboard receives a GitHub Actions webhook, gathers signals from each system, computes a health score, and stores a release snapshot in MongoDB.

## Walkthrough

1. Start the app:

```bash
npm run check-env
npm run dev:server
npm run dev:client
```

2. Open:

```txt
http://localhost:5173
```

3. Trigger the monitored repo workflow:

```txt
GitHub -> Actions -> Release Demo -> Run workflow
```

4. Wait for the workflow to complete.

5. Refresh the dashboard and select the newest deployment.

## What To Explain

- The webhook is verified with GitHub's `X-Hub-Signature-256` header.
- The backend ignores non-completed workflow runs to avoid duplicate deployment entries.
- The snapshot is deduped by workflow run ID.
- Sentry, PostHog, GCP Logging, and GitHub are fetched in parallel.
- `Promise.allSettled` prevents one integration failure from breaking the release snapshot.
- The health score translates raw tool data into a release recommendation.

## Live Data Notes

- PostHog zeros are expected if the tracked project has no events in the deploy window.
- GCP zeros are expected if no matching logs exist in the selected log stream.
- Sentry zeros are expected if no new unresolved issues appeared after deploy.

## Closing

The SE angle is that this is not just a dashboard. It is an integration story: authentication, webhooks, API normalization, graceful degradation, customer-configurable thresholds, and a clear operational decision.
