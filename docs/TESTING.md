# Testing The Release Intelligence Dashboard

## Local Mock Mode

Start the backend and frontend:

```bash
npm run dev:server
npm run dev:client
```

Open the Vite URL, usually `http://localhost:5173`.

## Manual Dashboard Test

1. Confirm the deployment timeline loads demo snapshots.
2. Select `healthy`, then click `Simulate Deployment`.
3. Confirm the newest deployment appears at the top with a green health score.
4. Select `watch`, then click `Simulate Deployment`.
5. Confirm Sentry, PostHog, and GCP signals degrade and recommendation changes to monitor or investigate.
6. Select `incident`, then click `Simulate Deployment`.
7. Confirm the release is red and the recommendation becomes rollback candidate.
8. Click older deployments in the timeline and confirm the detail panels update.
9. Click `Reset` and confirm the timeline returns to the default demo deployments.

## API Smoke Tests

Health check:

```bash
curl http://localhost:5050/health
```

List deployments:

```bash
curl http://localhost:5050/api/deployments
```

Reset demo deployments:

```bash
curl -X POST http://localhost:5050/api/deployments/reset
```

Create a simulated incident deployment:

```bash
curl -X POST http://localhost:5050/webhooks/github \
  -H "Content-Type: application/json" \
  -d "{\"simulation\":{\"scenario\":\"incident\"},\"workflow_run\":{\"id\":\"manual-curl-1\",\"name\":\"Deploy Production\",\"status\":\"completed\",\"conclusion\":\"failure\",\"created_at\":\"2026-06-23T20:00:00.000Z\",\"updated_at\":\"2026-06-23T20:04:00.000Z\",\"head_branch\":\"main\",\"head_sha\":\"abc1234\",\"triggering_actor\":{\"login\":\"himani\"}},\"repository\":{\"full_name\":\"himani/ai-code-review-bot\"}}"
```

## Expected Scenario Outcomes

| Scenario | Expected Status | Notes |
|---|---|---|
| healthy | green | Low errors, successful workflow |
| watch | amber | Elevated Sentry issues, log errors, product activity drop |
| incident | red | Failed workflow, crashed release health, critical logs |
