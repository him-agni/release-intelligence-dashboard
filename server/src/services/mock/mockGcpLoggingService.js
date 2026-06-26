const scenarios = {
  healthy: {
    errorCount: 3,
    warningCount: 11,
    criticalCount: 0
  },
  watch: {
    errorCount: 9,
    warningCount: 24,
    criticalCount: 0
  },
  incident: {
    errorCount: 39,
    warningCount: 61,
    criticalCount: 2
  }
};

export const fetchGcpLoggingSignals = async ({ simulationScenario }) =>
  scenarios[simulationScenario] || scenarios.healthy;
