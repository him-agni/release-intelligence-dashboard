# Release Health Scorecard

This scorecard documents how the dashboard turns deployment signals into a health score, status, recommendation, and release summary.

Source of truth in code:

- `server/src/controllers/githubWebhookController.js`
- `server/src/utils/healthScore.js`
- `server/src/services/live/sentryService.js`

## Signal Sources

Each completed deployment collects four groups of signals:

| Source | Signals Used |
| --- | --- |
| GitHub Actions | Workflow conclusion, failed job count, run URL |
| Sentry | New unresolved issues, issue event volume, release health |
| GCP Logging | Warning, error, and critical log counts |
| PostHog | Sessions, active users, error events, product activity delta |

If an integration fails, the controller records that integration as rejected and uses default fallback values for that source. The integration status panel should be checked alongside the score because fallback values can make a release look healthier than it really is.

## Health Score

The score starts at `100`. Penalties are subtracted when risk signals cross thresholds.

| Signal | Threshold | Penalty |
| --- | ---: | ---: |
| GitHub workflow conclusion | `failure` | `-35` |
| GitHub failed jobs | `> 0` | `-15` |
| Sentry new issues | `> 5` | `-20` |
| Sentry new issues | `> 10` | additional `-10` |
| Sentry release health | `degraded` | `-15` |
| Sentry release health | `crashed` | `-40` |
| Sentry error rate | `> 25` | `-10` |
| GCP critical logs | `> 0` | `-25` |
| GCP error logs | `> 10` | `-10` |
| GCP warning logs | `> 25` | `-5` |
| PostHog error events | `> 20` | `-10` |
| PostHog product activity delta | `< -30%` | `-10` |

The final score is clamped between `0` and `100`.

## Status Bands

| Score | Status |
| ---: | --- |
| `85-100` | `green` |
| `65-84` | `amber` |
| `0-64` | `red` |

## Recommendation Decision

Recommendations are based on both hard rollback conditions and the final score.

| Criteria | Recommendation |
| --- | --- |
| GitHub workflow failed, GCP has any critical logs, or Sentry release health is crashed | `rollback candidate` |
| No hard rollback condition and score `< 65` | `investigate` |
| No hard rollback condition and score `< 85` | `monitor` |
| No hard rollback condition and score `>= 85` | `ship confidently` |

Hard rollback conditions override the score-based recommendation.

## Sentry Issue Limits

Sentry release health is derived from new unresolved issues in the analysis window:

| New Sentry Issues | Release Health |
| ---: | --- |
| `0-5` | `healthy` |
| `6-10` | `degraded` |
| `> 10` | `crashed` |

Issue thresholds affect the score twice:

- More than `5` new issues subtracts `20` points.
- More than `10` new issues subtracts another `10` points and marks Sentry release health as `crashed`.

Because `crashed` is a hard rollback condition, more than `10` new Sentry issues makes the recommendation `rollback candidate`.

## Summary Reasons

The release summary explains the visible reasons behind the status. It currently includes:

- GitHub workflow failure
- Any new Sentry issues
- Any GCP critical logs
- Any GCP error logs
- PostHog product activity drop greater than `10%`

The summary is explanatory text only. It does not apply extra scoring beyond the scorecard rules above.
