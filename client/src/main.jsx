import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, CheckCircle2, Clock3, GitBranch, GitCommit, Gauge, Play, RadioTower, RefreshCw, ServerCrash, ShieldCheck, Users } from 'lucide-react';
import './styles.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

const getApiError = async (response, fallback) => {
  try {
    const data = await response.json();
    return data.detail || data.error || fallback;
  } catch {
    return fallback;
  }
};

const fetchDeployments = async () => {
  const response = await fetch(`${apiBaseUrl}/api/deployments`);

  if (!response.ok) {
    throw new Error(await getApiError(response, 'Unable to load deployments.'));
  }

  const data = await response.json();
  return data.deployments || [];
};

const simulateDeployment = async (scenario) => {
  const now = new Date();
  const startedAt = new Date(now.getTime() - 1000 * (180 + Math.floor(Math.random() * 160)));
  const shortSha = Math.random().toString(16).slice(2, 9);
  const runId = `manual-${now.getTime()}`;
  const conclusion = scenario === 'incident' ? 'failure' : 'success';

  const response = await fetch(`${apiBaseUrl}/api/deployments/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow_run: {
        id: runId,
        name: 'Deploy Production',
        status: 'completed',
        conclusion,
        created_at: startedAt.toISOString(),
        updated_at: now.toISOString(),
        head_branch: 'main',
        head_sha: shortSha,
        triggering_actor: { login: 'himani' }
      },
      repository: {
        full_name: 'himani/ai-code-review-bot'
      },
      sender: {
        login: 'manual-demo'
      },
      simulation: {
        scenario
      }
    })
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, 'Unable to simulate deployment.'));
  }

  const data = await response.json();
  return data.deployment;
};

const resetDeployments = async () => {
  const response = await fetch(`${apiBaseUrl}/api/deployments/reset`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, 'Unable to reset deployments.'));
  }

  const data = await response.json();
  return data.deployments || [];
};

const statusLabels = {
  green: 'Healthy',
  amber: 'Watch',
  red: 'Degraded'
};

const statusClass = {
  green: 'statusGreen',
  amber: 'statusAmber',
  red: 'statusRed'
};

const formatDate = (date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(date));

const Metric = ({ label, value, icon: Icon }) => (
  <div className="metric">
    <div className="metricIcon">
      <Icon size={17} />
    </div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="detailItem">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const SignalPanel = ({ title, children, icon: Icon }) => (
  <section className="panel">
    <div className="panelHeader">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
    <div className="metricGrid">{children}</div>
  </section>
);

const HealthBadge = ({ status, score }) => (
  <div className={`healthBadge ${statusClass[status]}`}>
    <Gauge size={19} />
    <span>{statusLabels[status] || 'Unknown'}</span>
    <strong>{score}</strong>
  </div>
);

const DeploymentCard = ({ deployment, selected, onSelect }) => (
  <button className={`deploymentRow ${selected ? 'selected' : ''}`} type="button" onClick={onSelect}>
    <span className={`dot ${statusClass[deployment.healthStatus]}`} />
    <span>
      <strong>{deployment.workflowName}</strong>
      <small>{deployment.repository}</small>
    </span>
    <span className="rowMeta">{formatDate(deployment.deployedAt)}</span>
  </button>
);

const App = () => {
  const [deployments, setDeployments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [scenario, setScenario] = useState('healthy');
  const [error, setError] = useState('');

  const loadDeployments = async () => {
    setLoading(true);
    setError('');

    try {
      const items = await fetchDeployments();
      setDeployments(items);
      setSelectedId((current) => current || items[0]?._id || items[0]?.deploymentId || null);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeployments();
  }, []);

  const handleSimulateDeployment = async () => {
    setSimulating(true);
    setError('');

    try {
      const deployment = await simulateDeployment(scenario);
      const deploymentId = deployment._id || deployment.deploymentId;
      setDeployments((current) => [deployment, ...current.filter((item) => (item._id || item.deploymentId) !== deploymentId)]);
      setSelectedId(deploymentId);
    } catch (simulateError) {
      setError(simulateError.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetDeployments = async () => {
    setResetting(true);
    setError('');

    try {
      const items = await resetDeployments();
      setDeployments(items);
      setSelectedId(items[0]?._id || items[0]?.deploymentId || null);
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setResetting(false);
    }
  };

  const selectedDeployment = useMemo(
    () => deployments.find((item) => item._id === selectedId || item.deploymentId === selectedId) || deployments[0],
    [deployments, selectedId]
  );

  if (loading && deployments.length === 0) {
    return <main className="loading">Loading release intelligence...</main>;
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p>Release Intelligence</p>
          <h1>Deployment Health</h1>
        </div>
        <div className="topActions">
          <div className="scenarioControl" aria-label="Simulation scenario">
            {['healthy', 'watch', 'incident'].map((option) => (
              <button
                className={scenario === option ? 'active' : ''}
                key={option}
                type="button"
                onClick={() => setScenario(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button className="primaryButton" type="button" onClick={handleSimulateDeployment} disabled={simulating}>
            <Play size={17} />
            <span>{simulating ? 'Simulating...' : 'Simulate Deployment'}</span>
          </button>
          <button className="iconButton" type="button" onClick={loadDeployments} aria-label="Refresh deployments" title="Refresh deployments">
            <RefreshCw size={18} />
          </button>
          <button className="secondaryButton" type="button" onClick={handleResetDeployments} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </header>

      {error && <div className="notice">{error}</div>}

      {selectedDeployment && (
        <section className="summaryBand">
          <div>
            <div className="deployMeta">
              <span><GitBranch size={15} /> {selectedDeployment.branch}</span>
              <span><GitCommit size={15} /> {selectedDeployment.commit}</span>
              <span><Clock3 size={15} /> {selectedDeployment.workflowDuration}s</span>
            </div>
            <h2>{selectedDeployment.repository}</h2>
            <p>{selectedDeployment.summary}</p>
          </div>
          <HealthBadge status={selectedDeployment.healthStatus} score={selectedDeployment.healthScore} />
        </section>
      )}

      <div className="workspace">
        <section className="mainColumn">
          {!selectedDeployment && (
            <section className="emptyState">
              <h2>No deployments yet</h2>
              <p>Trigger your GitHub Actions workflow, click Simulate Deployment, or use Reset to seed demo snapshots for UI testing.</p>
            </section>
          )}

          {selectedDeployment && (
            <>
              <div className="recommendation">
                <span>Recommendation</span>
                <strong>{selectedDeployment.recommendation}</strong>
              </div>

              <section className="detailStrip">
                <DetailItem label="Triggered by" value={selectedDeployment.triggeredBy} />
                <DetailItem label="Workflow" value={selectedDeployment.workflowStatus} />
                <DetailItem label="Deployed at" value={formatDate(selectedDeployment.deployedAt)} />
                <DetailItem label="Commit" value={selectedDeployment.commit} />
              </section>

              <div className="panels">
                <SignalPanel title="Sentry" icon={ServerCrash}>
                  <Metric label="New issues" value={selectedDeployment.sentry.newIssues} icon={AlertTriangle} />
                  <Metric label="Error rate" value={`${selectedDeployment.sentry.errorRate}/min`} icon={Activity} />
                  <Metric label="Release health" value={selectedDeployment.sentry.releaseHealth} icon={CheckCircle2} />
                </SignalPanel>

                <SignalPanel title="PostHog" icon={Users}>
                  <Metric label="Sessions" value={selectedDeployment.posthog.sessionCount.toLocaleString()} icon={RadioTower} />
                  <Metric label="Active users" value={selectedDeployment.posthog.activeUsers.toLocaleString()} icon={Users} />
                  <Metric label="Exceptions" value={selectedDeployment.posthog.errorEvents} icon={AlertTriangle} />
                  <Metric label="Activity delta" value={`${selectedDeployment.posthog.eventDeltaPercent}%`} icon={Activity} />
                </SignalPanel>

                <SignalPanel title="GCP Logs" icon={Activity}>
                  <Metric label="Critical" value={selectedDeployment.gcpLogs.criticalCount} icon={ServerCrash} />
                  <Metric label="Errors" value={selectedDeployment.gcpLogs.errorCount} icon={AlertTriangle} />
                  <Metric label="Warnings" value={selectedDeployment.gcpLogs.warningCount} icon={Activity} />
                </SignalPanel>

                <SignalPanel title="GitHub Actions" icon={GitBranch}>
                  <Metric label="Conclusion" value={selectedDeployment.github.runConclusion} icon={CheckCircle2} />
                  <Metric label="Failed jobs" value={selectedDeployment.github.jobsFailed} icon={AlertTriangle} />
                  <Metric label="Duration" value={`${selectedDeployment.workflowDuration}s`} icon={Clock3} />
                </SignalPanel>
              </div>

              <section className="panel signalHealth">
                <div className="panelHeader">
                  <ShieldCheck size={18} />
                  <h2>Integration Status</h2>
                </div>
                <div className="signalList">
                  {(selectedDeployment.signalStatuses || []).map((signal) => (
                    <div className="signalRow" key={signal.source}>
                      <span className={`dot ${signal.status === 'fulfilled' ? 'statusGreen' : 'statusRed'}`} />
                      <strong>{signal.source}</strong>
                      <span>{signal.message}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </section>

        <aside className="history">
          <div className="historyHeader">
            <h2>Deployment Timeline</h2>
            <span>{deployments.length}</span>
          </div>
          <div className="historyList">
            {deployments.map((deployment) => (
              <DeploymentCard
                key={deployment._id || deployment.deploymentId}
                deployment={deployment}
                selected={(deployment._id || deployment.deploymentId) === (selectedDeployment?._id || selectedDeployment?.deploymentId)}
                onSelect={() => setSelectedId(deployment._id || deployment.deploymentId)}
              />
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
};

createRoot(document.getElementById('root')).render(<App />);
