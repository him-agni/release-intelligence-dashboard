const scenarios = {
  healthy: {
    newIssues: 2,
    errorRate: 5,
    releaseHealth: 'healthy'
  },
  watch: {
    newIssues: 6,
    errorRate: 16,
    releaseHealth: 'healthy'
  },
  incident: {
    newIssues: 14,
    errorRate: 42,
    releaseHealth: 'crashed'
  }
};

export const fetchSentryReleaseSignals = async ({ simulationScenario }) =>
  scenarios[simulationScenario] || scenarios.healthy;
