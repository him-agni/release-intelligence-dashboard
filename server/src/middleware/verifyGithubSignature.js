import crypto from 'crypto';

export const verifyGithubSignature = (req, res, next) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || process.env.DATA_MODE === 'mock') {
    return next();
  }

  const signature = req.header('x-hub-signature-256');

  if (!signature) {
    return res.status(401).json({ error: 'Missing GitHub signature.' });
  }

  const body = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const digest = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
    return res.status(401).json({ error: 'Invalid GitHub signature.' });
  }

  return next();
};
