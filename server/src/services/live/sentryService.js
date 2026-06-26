import { fetchJson, getTimeWindow } from './http.js';

const normalizeOrgSlug = (slug) =>
  slug
    .replace(/^https?:\/\//, '')
    .replace(/\.sentry\.io\/?$/, '')
    .replace(/\/$/, '');

export const fetchSentryReleaseSignals = async ({ deployedAt }) => {
  if (!process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG_SLUG || !process.env.SENTRY_PROJECT_SLUG) {
    throw new Error('Sentry credentials are missing. Set SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, and SENTRY_PROJECT_SLUG.');
  }

  const orgSlug = normalizeOrgSlug(process.env.SENTRY_ORG_SLUG);
  const { startIso } = getTimeWindow(deployedAt);
  const query = encodeURIComponent(`is:unresolved firstSeen:>${startIso}`);
  const url = `https://sentry.io/api/0/projects/${orgSlug}/${process.env.SENTRY_PROJECT_SLUG}/issues/?query=${query}&limit=100`;

  const issues = await fetchJson(url, {
    headers: {
      Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}`
    }
  });

  const newIssues = Array.isArray(issues) ? issues.length : 0;
  const eventTotal = Array.isArray(issues)
    ? issues.reduce((total, issue) => total + Number.parseInt(issue.count || '0', 10), 0)
    : 0;
  const errorRate = Math.round(eventTotal / 60);

  return {
    newIssues,
    errorRate,
    releaseHealth: newIssues > 10 ? 'crashed' : newIssues > 5 ? 'degraded' : 'healthy'
  };
};
