import dotenv from 'dotenv';

dotenv.config();

const checks = [];

const addCheck = (name, ok, detail) => {
  checks.push({ name, ok, detail });
};

addCheck('DATA_MODE', ['mock', 'live'].includes(process.env.DATA_MODE || 'mock'), `current: ${process.env.DATA_MODE || 'mock'}`);
addCheck('GITHUB_TOKEN', Boolean(process.env.GITHUB_TOKEN), process.env.GITHUB_TOKEN ? 'set' : 'missing');
addCheck('GITHUB_REPO', /^[^/]+\/[^/]+$/.test(process.env.GITHUB_REPO || ''), 'expected owner/repo');
addCheck('GITHUB_WEBHOOK_SECRET', Boolean(process.env.GITHUB_WEBHOOK_SECRET), process.env.GITHUB_WEBHOOK_SECRET ? 'set' : 'missing');
addCheck('SENTRY_AUTH_TOKEN', Boolean(process.env.SENTRY_AUTH_TOKEN), process.env.SENTRY_AUTH_TOKEN ? 'set' : 'missing');
addCheck('SENTRY_ORG_SLUG', Boolean(process.env.SENTRY_ORG_SLUG && !process.env.SENTRY_ORG_SLUG.startsWith('http')), 'use slug only, not URL');
addCheck('SENTRY_PROJECT_SLUGS', Boolean(process.env.SENTRY_PROJECT_SLUGS || process.env.SENTRY_PROJECT_SLUG), process.env.SENTRY_PROJECT_SLUGS ? `set: ${process.env.SENTRY_PROJECT_SLUGS}` : process.env.SENTRY_PROJECT_SLUG ? `using legacy single project: ${process.env.SENTRY_PROJECT_SLUG}` : 'missing');
addCheck('POSTHOG_API_KEY', Boolean(process.env.POSTHOG_API_KEY), process.env.POSTHOG_API_KEY ? 'set' : 'missing');
addCheck('POSTHOG_PROJECT_ID', /^\d+$/.test(process.env.POSTHOG_PROJECT_ID || ''), 'expected numeric project ID from PostHog URL');
addCheck('POSTHOG_HOST', /^https:\/\/(us|eu)\.posthog\.com$/.test(process.env.POSTHOG_HOST || ''), 'expected https://us.posthog.com or https://eu.posthog.com');
addCheck('POSTHOG_APP_FILTER', true, process.env.POSTHOG_APP_FILTER ? `filtering app=${process.env.POSTHOG_APP_FILTER}` : 'optional; counts all app events when unset');
addCheck('POSTHOG_MONITORED_PROJECT_FILTER', true, process.env.POSTHOG_MONITORED_PROJECT_FILTER ? `filtering monitored_project=${process.env.POSTHOG_MONITORED_PROJECT_FILTER}` : 'optional; counts all monitored projects when unset');
addCheck('GCP_PROJECT_ID', Boolean(process.env.GCP_PROJECT_ID), process.env.GCP_PROJECT_ID ? 'set' : 'missing');
addCheck('GCP_LOG_NAME', Boolean(process.env.GCP_LOG_NAME), process.env.GCP_LOG_NAME ? 'set' : 'missing');

let gcpJsonOk = false;

try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8'));
    gcpJsonOk = true;
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    gcpJsonOk = true;
  }
} catch {
  gcpJsonOk = false;
}

addCheck('Google service account JSON', gcpJsonOk, 'use single-line JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64');

for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FIX'} ${check.name}: ${check.detail}`);
}

if (checks.some((check) => !check.ok)) {
  process.exitCode = 1;
}
