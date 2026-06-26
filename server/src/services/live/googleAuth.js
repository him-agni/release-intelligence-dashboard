import crypto from 'crypto';
import { fetchJson } from './http.js';

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

const parseServiceAccountJson = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    try {
      return JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8'));
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 must decode to valid service account JSON.');
    }
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is missing.');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be valid single-line JSON.');
  }
};

export const getGoogleAccessToken = async () => {
  const serviceAccount = parseServiceAccountJson();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/logging.read',
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsignedJwt).sign(serviceAccount.private_key);
  const assertion = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const tokenResponse = await fetchJson(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  return tokenResponse.access_token;
};
