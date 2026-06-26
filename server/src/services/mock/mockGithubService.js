export const fetchGithubWorkflowSignals = async ({ workflowRun }) => ({
  runConclusion: workflowRun?.conclusion || 'success',
  runUrl: workflowRun?.html_url || 'https://github.com/example/release-intelligence/actions',
  jobsFailed: workflowRun?.conclusion === 'failure' ? 1 : 0
});
