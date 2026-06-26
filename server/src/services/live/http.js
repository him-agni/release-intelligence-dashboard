export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.detail || data?.error || data?.message || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }

  return data;
};

export const getTimeWindow = (deployedAt) => {
  const end = deployedAt ? new Date(deployedAt) : new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const previousStart = new Date(start.getTime() - 60 * 60 * 1000);

  return {
    start,
    end,
    previousStart,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    previousStartIso: previousStart.toISOString()
  };
};
