const scenarios = {
  healthy: {
    sessionCount: 1240,
    errorEvents: 7,
    activeUsers: 386,
    eventDeltaPercent: 6
  },
  watch: {
    sessionCount: 1030,
    errorEvents: 18,
    activeUsers: 312,
    eventDeltaPercent: -18
  },
  incident: {
    sessionCount: 744,
    errorEvents: 51,
    activeUsers: 189,
    eventDeltaPercent: -42
  }
};

export const fetchPosthogReleaseSignals = async ({ simulationScenario }) =>
  scenarios[simulationScenario] || scenarios.healthy;
