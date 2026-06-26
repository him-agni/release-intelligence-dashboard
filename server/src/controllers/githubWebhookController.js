import Deployment from '../models/Deployment.js';
import { getServices } from '../services/serviceRegistry.js';
import { addDemoDeployment } from '../store/demoDeploymentStore.js';
import { buildReleaseSummary, calculateHealthScore, getHealthStatus, getRecommendation } from '../utils/healthScore.js';

const defaultSignals = {
  sentry: { newIssues: 0, errorRate: 0, releaseHealth: 'healthy' },
  posthog: { sessionCount: 0, errorEvents: 0, activeUsers: 0, eventDeltaPercent: 0 },
  gcpLogs: { errorCount: 0, warningCount: 0, criticalCount: 0 },
  github: { runConclusion: 'unknown', runUrl: '', jobsFailed: 0 }
};

const normalizeWorkflowPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error('Webhook payload must be a JSON object.');
    error.statusCode = 400;
    throw error;
  }

  const workflowRun = body.workflow_run || {};
  const repository = body.repository || {};
  const createdAt = workflowRun.created_at ? new Date(workflowRun.created_at) : new Date();
  const updatedAt = workflowRun.updated_at ? new Date(workflowRun.updated_at) : createdAt;
  const workflowDuration = Math.max(0, Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000));

  return {
    deploymentId: String(workflowRun.id || body.deployment?.id || `manual-${Date.now()}`),
    repository: repository.full_name || process.env.GITHUB_REPO || 'unknown/repository',
    branch: workflowRun.head_branch || body.deployment?.ref || 'main',
    commit: workflowRun.head_sha || body.deployment?.sha || 'unknown',
    triggeredBy: workflowRun.triggering_actor?.login || body.sender?.login || 'unknown',
    deployedAt: updatedAt,
    workflowDuration,
    workflowStatus: workflowRun.status || 'completed',
    workflowName: workflowRun.name || 'Deployment',
    simulationScenario: body.simulation?.scenario || 'healthy',
    workflowRun
  };
};

const settleSignal = (source, result, fallbackValue) => {
  if (result.status === 'fulfilled') {
    return {
      value: result.value,
      status: { source, status: 'fulfilled', message: 'Fetched successfully.' }
    };
  }

  return {
    value: fallbackValue,
    status: { source, status: 'rejected', message: result.reason?.message || 'Fetch failed.' }
  };
};

export const handleGithubWebhook = async (req, res) => {
  const deploymentContext = normalizeWorkflowPayload(req.body);

  if (req.body.workflow_run && deploymentContext.workflowStatus !== 'completed') {
    return res.status(202).json({
      message: `Ignored workflow_run with status "${deploymentContext.workflowStatus}". Waiting for completed workflow runs.`
    });
  }

  const services = getServices();

  const [sentryResult, posthogResult, gcpLogsResult, githubResult] = await Promise.allSettled([
    services.sentry.fetchSentryReleaseSignals(deploymentContext),
    services.posthog.fetchPosthogReleaseSignals(deploymentContext),
    services.gcpLogging.fetchGcpLoggingSignals(deploymentContext),
    services.github.fetchGithubWorkflowSignals(deploymentContext)
  ]);

  const sentry = settleSignal('sentry', sentryResult, defaultSignals.sentry);
  const posthog = settleSignal('posthog', posthogResult, defaultSignals.posthog);
  const gcpLogs = settleSignal('gcpLogs', gcpLogsResult, defaultSignals.gcpLogs);
  const github = settleSignal('github', githubResult, defaultSignals.github);

  const healthScore = calculateHealthScore({
    sentry: sentry.value,
    posthog: posthog.value,
    gcpLogs: gcpLogs.value,
    github: github.value
  });
  const healthStatus = getHealthStatus(healthScore);
  const recommendation = getRecommendation({
    healthScore,
    sentry: sentry.value,
    gcpLogs: gcpLogs.value,
    github: github.value
  });
  const summary = buildReleaseSummary({
    sentry: sentry.value,
    posthog: posthog.value,
    gcpLogs: gcpLogs.value,
    github: github.value,
    healthStatus
  });

  const snapshot = {
    ...deploymentContext,
    sentry: sentry.value,
    posthog: posthog.value,
    gcpLogs: gcpLogs.value,
    github: github.value,
    healthScore,
    healthStatus,
    recommendation,
    summary,
    signalStatuses: [sentry.status, posthog.status, gcpLogs.status, github.status]
  };

  delete snapshot.workflowRun;
  delete snapshot.simulationScenario;

  const savedSnapshot =
    Deployment.db.readyState === 1
      ? await Deployment.findOneAndUpdate({ deploymentId: snapshot.deploymentId }, snapshot, {
          new: true,
          upsert: true,
          runValidators: true
        })
      : addDemoDeployment(snapshot);

  res.status(201).json({
    message: 'Deployment health snapshot created.',
    deployment: savedSnapshot
  });
};

export const simulateGithubWebhook = async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEPLOYMENT_SIMULATION !== 'true') {
    return res.status(403).json({ error: 'Deployment simulation is disabled in production.' });
  }

  return handleGithubWebhook(req, res);
};
