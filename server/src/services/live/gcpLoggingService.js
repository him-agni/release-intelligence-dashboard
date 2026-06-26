import { getGoogleAccessToken } from './googleAuth.js';
import { fetchJson, getTimeWindow } from './http.js';

const countSeverity = async ({ accessToken, severity, startIso, endIso }) => {
  const projectId = process.env.GCP_PROJECT_ID;
  const logName = process.env.GCP_LOG_NAME;
  const filterParts = [
    `timestamp >= "${startIso}"`,
    `timestamp <= "${endIso}"`,
    `severity = ${severity}`
  ];

  if (logName) {
    filterParts.push(`logName = "projects/${projectId}/logs/${logName}"`);
  }

  const data = await fetchJson('https://logging.googleapis.com/v2/entries:list', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resourceNames: [`projects/${projectId}`],
      filter: filterParts.join(' AND '),
      pageSize: 100
    })
  });

  return data.entries?.length || 0;
};

export const fetchGcpLoggingSignals = async ({ deployedAt }) => {
  if ((!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) || !process.env.GCP_PROJECT_ID || !process.env.GCP_LOG_NAME) {
    throw new Error('GCP Logging credentials are missing. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, plus GCP_PROJECT_ID and GCP_LOG_NAME.');
  }

  const { startIso, endIso } = getTimeWindow(deployedAt);
  const accessToken = await getGoogleAccessToken();
  const [warningCount, errorCount, criticalCount] = await Promise.all([
    countSeverity({ accessToken, severity: 'WARNING', startIso, endIso }),
    countSeverity({ accessToken, severity: 'ERROR', startIso, endIso }),
    countSeverity({ accessToken, severity: 'CRITICAL', startIso, endIso })
  ]);

  return {
    errorCount,
    warningCount,
    criticalCount
  };
};
