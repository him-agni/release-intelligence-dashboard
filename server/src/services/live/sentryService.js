import { fetchJson, getTimeWindow } from './http.js';

const normalizeOrgSlug = (slug) =>
  slug
    .replace(/^https?:\/\//, '')
    .replace(/\.sentry\.io\/?$/, '')
    .replace(/\/$/, '');

const getProjectSlugs = () =>
  (process.env.SENTRY_PROJECT_SLUGS || process.env.SENTRY_PROJECT_SLUG || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);

export const fetchSentryReleaseSignals = async ({ deployedAt }) => {
  const projectSlugs = getProjectSlugs();

  if (!process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG_SLUG || projectSlugs.length === 0) {
    throw new Error('Sentry credentials are missing. Set SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, and SENTRY_PROJECT_SLUGS.');
  }

  const orgSlug = normalizeOrgSlug(process.env.SENTRY_ORG_SLUG);
  const { startIso } = getTimeWindow(deployedAt);
  const query = encodeURIComponent(`is:unresolved firstSeen:>${startIso}`);
  const issueLists = await Promise.all(
    projectSlugs.map((projectSlug) =>
      fetchJson(`https://sentry.io/api/0/projects/${orgSlug}/${projectSlug}/issues/?query=${query}&limit=100`, {
        headers: {
          Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}`
        }
      })
    )
  );
  const issues = issueLists.flatMap((projectIssues) => (Array.isArray(projectIssues) ? projectIssues : []));

  const newIssues = issues.length;
  const eventTotal = issues.reduce((total, issue) => total + Number.parseInt(issue.count || '0', 10), 0);
  const errorRate = Math.round(eventTotal / 60);

  return {
    newIssues,
    errorRate,
    releaseHealth: newIssues > 10 ? 'crashed' : newIssues > 5 ? 'degraded' : 'healthy'
  };
};
