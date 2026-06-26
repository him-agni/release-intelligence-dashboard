export const getHealthStatus = (score) => {
  if (score >= 85) return 'green';
  if (score >= 65) return 'amber';
  return 'red';
};

export const getRecommendation = ({ healthScore, sentry, gcpLogs, github }) => {
  if (github?.runConclusion === 'failure' || gcpLogs?.criticalCount > 0 || sentry?.releaseHealth === 'crashed') {
    return 'rollback candidate';
  }

  if (healthScore < 65) return 'investigate';
  if (healthScore < 85) return 'monitor';
  return 'ship confidently';
};

export const calculateHealthScore = ({ sentry, posthog, gcpLogs, github }) => {
  let score = 100;

  if (github?.runConclusion === 'failure') score -= 35;
  if (github?.jobsFailed > 0) score -= 15;

  if (sentry?.newIssues > 5) score -= 20;
  if (sentry?.newIssues > 10) score -= 10;
  if (sentry?.releaseHealth === 'degraded') score -= 15;
  if (sentry?.releaseHealth === 'crashed') score -= 40;
  if (sentry?.errorRate > 25) score -= 10;

  if (gcpLogs?.criticalCount > 0) score -= 25;
  if (gcpLogs?.errorCount > 10) score -= 10;
  if (gcpLogs?.warningCount > 25) score -= 5;

  if (posthog?.errorEvents > 20) score -= 10;
  if (posthog?.eventDeltaPercent < -30) score -= 10;

  return Math.max(0, Math.min(100, score));
};

export const buildReleaseSummary = ({ sentry, posthog, gcpLogs, github, healthStatus }) => {
  const reasons = [];

  if (github?.runConclusion === 'failure') reasons.push('the workflow concluded with a failure');
  if (sentry?.newIssues > 0) reasons.push(`${sentry.newIssues} new Sentry issue${sentry.newIssues === 1 ? '' : 's'}`);
  if (gcpLogs?.criticalCount > 0) reasons.push(`${gcpLogs.criticalCount} critical log event${gcpLogs.criticalCount === 1 ? '' : 's'}`);
  if (gcpLogs?.errorCount > 0) reasons.push(`${gcpLogs.errorCount} GCP error log${gcpLogs.errorCount === 1 ? '' : 's'}`);
  if (posthog?.eventDeltaPercent < -10) reasons.push(`${Math.abs(posthog.eventDeltaPercent)}% lower product activity after deploy`);

  if (reasons.length === 0) {
    return `Release is ${healthStatus}. No major negative signals were detected after deployment.`;
  }

  return `Release is ${healthStatus} due to ${reasons.join(', ')}.`;
};
