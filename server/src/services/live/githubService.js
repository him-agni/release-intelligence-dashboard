import { fetchJson } from './http.js';

const parseRepository = (repository) => {
  const [owner, repo] = repository.split('/');

  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repository: ${repository}`);
  }

  return { owner, repo };
};

export const fetchGithubWorkflowSignals = async ({ workflowRun, repository }) => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GitHub token is missing. Set GITHUB_TOKEN for live workflow details.');
  }

  if (!workflowRun?.id) {
    return {
      runConclusion: workflowRun?.conclusion || 'unknown',
      runUrl: workflowRun?.html_url || '',
      jobsFailed: workflowRun?.conclusion === 'failure' ? 1 : 0
    };
  }

  const { owner, repo } = parseRepository(repository || process.env.GITHUB_REPO || '');
  const jobs = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${workflowRun.id}/jobs?per_page=100`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  const failedJobs = (jobs.jobs || []).filter((job) => job.conclusion && job.conclusion !== 'success' && job.conclusion !== 'skipped');

  return {
    runConclusion: workflowRun?.conclusion || 'unknown',
    runUrl: workflowRun?.html_url || '',
    jobsFailed: failedJobs.length
  };
};
