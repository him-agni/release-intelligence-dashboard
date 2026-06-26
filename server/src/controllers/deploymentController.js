import Deployment from '../models/Deployment.js';
import { findDemoDeployment, getInitialDemoDeployments, listDemoDeployments, resetDemoDeployments } from '../store/demoDeploymentStore.js';

export const listDeployments = async (_req, res) => {
  if (Deployment.db.readyState !== 1) {
    return res.json({ deployments: listDemoDeployments() });
  }

  const deployments = await Deployment.find().sort({ deployedAt: -1 }).limit(50);
  return res.json({ deployments });
};

export const getDeployment = async (req, res) => {
  if (Deployment.db.readyState !== 1) {
    const deployment = findDemoDeployment(req.params.id);
    return deployment ? res.json({ deployment }) : res.status(404).json({ error: 'Deployment not found.' });
  }

  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found.' });
  }

  return res.json({ deployment });
};

export const resetDeployments = async (_req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEPLOYMENT_RESET !== 'true') {
    return res.status(403).json({ error: 'Deployment reset is disabled in production.' });
  }

  if (Deployment.db.readyState !== 1) {
    return res.json({ deployments: resetDemoDeployments() });
  }

  const seedDeployments = getInitialDemoDeployments().map(({ _id, ...deployment }) => deployment);

  await Deployment.bulkWrite(
    seedDeployments.map((deployment) => ({
      updateOne: {
        filter: { deploymentId: deployment.deploymentId },
        update: { $set: deployment },
        upsert: true
      }
    }))
  );

  const deployments = await Deployment.find().sort({ deployedAt: -1 }).limit(50);
  return res.json({ deployments });
};
