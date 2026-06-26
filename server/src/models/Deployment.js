import mongoose from 'mongoose';

const signalStatusSchema = new mongoose.Schema(
  {
    source: String,
    status: {
      type: String,
      enum: ['fulfilled', 'rejected'],
      required: true
    },
    message: String
  },
  { _id: false }
);

const deploymentSchema = new mongoose.Schema(
  {
    deploymentId: { type: String, required: true, index: true },
    repository: { type: String, required: true },
    branch: String,
    commit: String,
    triggeredBy: String,
    deployedAt: { type: Date, required: true },
    workflowDuration: Number,
    workflowStatus: String,
    workflowName: String,
    sentry: {
      newIssues: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0 },
      releaseHealth: {
        type: String,
        enum: ['healthy', 'degraded', 'crashed'],
        default: 'healthy'
      }
    },
    posthog: {
      sessionCount: { type: Number, default: 0 },
      errorEvents: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 },
      eventDeltaPercent: { type: Number, default: 0 }
    },
    gcpLogs: {
      errorCount: { type: Number, default: 0 },
      warningCount: { type: Number, default: 0 },
      criticalCount: { type: Number, default: 0 }
    },
    github: {
      runConclusion: String,
      runUrl: String,
      jobsFailed: { type: Number, default: 0 }
    },
    healthScore: { type: Number, required: true },
    healthStatus: {
      type: String,
      enum: ['green', 'amber', 'red'],
      required: true
    },
    recommendation: {
      type: String,
      enum: ['ship confidently', 'monitor', 'investigate', 'rollback candidate'],
      required: true
    },
    summary: String,
    signalStatuses: [signalStatusSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Deployment', deploymentSchema);
