const initialDemoDeployments = [
  {
    _id: 'demo-3',
    deploymentId: 'demo-run-1003',
    repository: 'himani/ai-code-review-bot',
    branch: 'main',
    commit: '9f31ac2',
    triggeredBy: 'himani',
    deployedAt: new Date('2026-06-23T16:04:00.000Z'),
    workflowDuration: 244,
    workflowStatus: 'completed',
    workflowName: 'Deploy Production',
    sentry: { newIssues: 3, errorRate: 8, releaseHealth: 'healthy' },
    posthog: { sessionCount: 1240, errorEvents: 9, activeUsers: 386, eventDeltaPercent: 6 },
    gcpLogs: { errorCount: 4, warningCount: 14, criticalCount: 0 },
    github: { runConclusion: 'success', runUrl: 'https://github.com/example/actions', jobsFailed: 0 },
    healthScore: 100,
    healthStatus: 'green',
    recommendation: 'ship confidently',
    summary: 'Release is green due to 3 new Sentry issues, 4 GCP error logs.',
    signalStatuses: []
  },
  {
    _id: 'demo-2',
    deploymentId: 'demo-run-1002',
    repository: 'himani/ai-code-review-bot',
    branch: 'main',
    commit: '41ed0fb',
    triggeredBy: 'github-actions',
    deployedAt: new Date('2026-06-22T21:18:00.000Z'),
    workflowDuration: 319,
    workflowStatus: 'completed',
    workflowName: 'Deploy Production',
    sentry: { newIssues: 8, errorRate: 19, releaseHealth: 'degraded' },
    posthog: { sessionCount: 1022, errorEvents: 22, activeUsers: 301, eventDeltaPercent: -12 },
    gcpLogs: { errorCount: 16, warningCount: 31, criticalCount: 0 },
    github: { runConclusion: 'success', runUrl: 'https://github.com/example/actions', jobsFailed: 0 },
    healthScore: 50,
    healthStatus: 'red',
    recommendation: 'investigate',
    summary: 'Release is red due to 8 new Sentry issues, 16 GCP error logs, 12% lower product activity after deploy.',
    signalStatuses: []
  },
  {
    _id: 'demo-1',
    deploymentId: 'demo-run-1001',
    repository: 'himani/ai-code-review-bot',
    branch: 'main',
    commit: '18aa72d',
    triggeredBy: 'himani',
    deployedAt: new Date('2026-06-21T15:42:00.000Z'),
    workflowDuration: 201,
    workflowStatus: 'completed',
    workflowName: 'Deploy Production',
    sentry: { newIssues: 1, errorRate: 4, releaseHealth: 'healthy' },
    posthog: { sessionCount: 1188, errorEvents: 5, activeUsers: 352, eventDeltaPercent: 3 },
    gcpLogs: { errorCount: 2, warningCount: 9, criticalCount: 0 },
    github: { runConclusion: 'success', runUrl: 'https://github.com/example/actions', jobsFailed: 0 },
    healthScore: 100,
    healthStatus: 'green',
    recommendation: 'ship confidently',
    summary: 'Release is green due to 1 new Sentry issue, 2 GCP error logs.',
    signalStatuses: []
  }
];

const cloneDeployment = (deployment) => ({
  ...deployment,
  deployedAt: new Date(deployment.deployedAt),
  sentry: { ...deployment.sentry },
  posthog: { ...deployment.posthog },
  gcpLogs: { ...deployment.gcpLogs },
  github: { ...deployment.github },
  signalStatuses: [...deployment.signalStatuses]
});

const MAX_DEMO_DEPLOYMENTS = 50;

const demoDeployments = initialDemoDeployments.map(cloneDeployment);

export const getInitialDemoDeployments = () => initialDemoDeployments.map(cloneDeployment);

export const listDemoDeployments = () =>
  [...demoDeployments].sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());

export const resetDemoDeployments = () => {
  demoDeployments.splice(0, demoDeployments.length, ...initialDemoDeployments.map(cloneDeployment));
  return listDemoDeployments();
};

export const addDemoDeployment = (deployment) => {
  const snapshot = {
    ...deployment,
    _id: deployment._id || `demo-${deployment.deploymentId}`
  };

  const existingIndex = demoDeployments.findIndex((item) => item.deploymentId === snapshot.deploymentId);

  if (existingIndex >= 0) {
    demoDeployments.splice(existingIndex, 1);
  }

  demoDeployments.unshift(snapshot);
  demoDeployments.length = Math.min(demoDeployments.length, MAX_DEMO_DEPLOYMENTS);
  return snapshot;
};

export const findDemoDeployment = (id) =>
  demoDeployments.find((item) => item._id === id || item.deploymentId === id);
