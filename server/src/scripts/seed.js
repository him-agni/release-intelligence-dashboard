import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Deployment from '../models/Deployment.js';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is required to seed deployments.');
  process.exit(1);
}

await mongoose.connect(uri);

await Deployment.deleteMany({});
await Deployment.create([
  {
    deploymentId: 'seed-run-1001',
    repository: 'himani/ai-code-review-bot',
    branch: 'main',
    commit: '18aa72d',
    triggeredBy: 'himani',
    deployedAt: new Date(),
    workflowDuration: 201,
    workflowStatus: 'completed',
    workflowName: 'Deploy Production',
    sentry: { newIssues: 2, errorRate: 5, releaseHealth: 'healthy' },
    posthog: { sessionCount: 1188, errorEvents: 5, activeUsers: 352, eventDeltaPercent: 3 },
    gcpLogs: { errorCount: 2, warningCount: 9, criticalCount: 0 },
    github: { runConclusion: 'success', runUrl: 'https://github.com/example/actions', jobsFailed: 0 },
    healthScore: 100,
    healthStatus: 'green',
    recommendation: 'ship confidently',
    summary: 'Release is green due to 2 new Sentry issues, 2 GCP error logs.',
    signalStatuses: []
  }
]);

await mongoose.disconnect();
console.log('Seeded deployment snapshots.');
