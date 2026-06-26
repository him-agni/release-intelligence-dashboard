import express from 'express';
import { getDeployment, listDeployments, resetDeployments } from '../controllers/deploymentController.js';
import { simulateGithubWebhook } from '../controllers/githubWebhookController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(listDeployments));
router.post('/reset', asyncHandler(resetDeployments));
router.post('/simulate', asyncHandler(simulateGithubWebhook));
router.get('/:id', asyncHandler(getDeployment));

export default router;
