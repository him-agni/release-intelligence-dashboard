import express from 'express';
import { handleGithubWebhook } from '../controllers/githubWebhookController.js';
import { verifyGithubSignature } from '../middleware/verifyGithubSignature.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/github', verifyGithubSignature, asyncHandler(handleGithubWebhook));

export default router;
