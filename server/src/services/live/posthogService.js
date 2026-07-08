import { fetchJson, getTimeWindow } from './http.js';

const escapeHogqlString = (value) => String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");

const queryHogql = async (query) => {
  const host = process.env.POSTHOG_HOST || 'https://us.posthog.com';
  const projectId = process.env.POSTHOG_PROJECT_ID;

  const response = await fetchJson(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.POSTHOG_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query
      }
    })
  });

  return response.results?.[0] || [];
};

export const fetchPosthogReleaseSignals = async ({ deployedAt }) => {
  if (!process.env.POSTHOG_API_KEY || !process.env.POSTHOG_PROJECT_ID) {
    throw new Error('PostHog credentials are missing. Set POSTHOG_API_KEY and POSTHOG_PROJECT_ID.');
  }

  const { startIso, endIso, previousStartIso } = getTimeWindow(deployedAt);
  const appFilter = process.env.POSTHOG_APP_FILTER?.trim();
  const monitoredProjectFilter = process.env.POSTHOG_MONITORED_PROJECT_FILTER?.trim();
  const filterClauses = [
    appFilter ? `properties.app = '${escapeHogqlString(appFilter)}'` : '',
    monitoredProjectFilter ? `properties.monitored_project = '${escapeHogqlString(monitoredProjectFilter)}'` : ''
  ].filter(Boolean);
  const projectFilterClause = filterClauses.length ? `\n      AND ${filterClauses.join('\n      AND ')}` : '';
  const [sessionCount, activeUsers, errorEvents, currentEvents, previousEvents] = await queryHogql(`
    SELECT
      count(DISTINCT properties.$session_id) AS session_count,
      count(DISTINCT person_id) AS active_users,
      countIf(event IN ('$exception', 'demo_frontend_error', 'demo_backend_error')) AS error_events,
      countIf(timestamp >= toDateTime('${startIso}') AND timestamp <= toDateTime('${endIso}')) AS current_events,
      countIf(timestamp >= toDateTime('${previousStartIso}') AND timestamp < toDateTime('${startIso}')) AS previous_events
    FROM events
    WHERE timestamp >= toDateTime('${previousStartIso}')
      AND timestamp <= toDateTime('${endIso}')
      ${projectFilterClause}
  `);
  const current = Number(currentEvents || 0);
  const previous = Number(previousEvents || 0);
  const eventDeltaPercent = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

  return {
    sessionCount: Number(sessionCount || 0),
    activeUsers: Number(activeUsers || 0),
    errorEvents: Number(errorEvents || 0),
    eventDeltaPercent
  };
};
