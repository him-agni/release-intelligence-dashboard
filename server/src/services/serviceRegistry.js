import * as mockSentry from './mock/mockSentryService.js';
import * as mockPosthog from './mock/mockPosthogService.js';
import * as mockGcpLogging from './mock/mockGcpLoggingService.js';
import * as mockGithub from './mock/mockGithubService.js';
import * as liveSentry from './live/sentryService.js';
import * as livePosthog from './live/posthogService.js';
import * as liveGcpLogging from './live/gcpLoggingService.js';
import * as liveGithub from './live/githubService.js';

export const getServices = () => {
  const dataMode = process.env.DATA_MODE || 'mock';

  if (dataMode === 'live') {
    return {
      sentry: liveSentry,
      posthog: livePosthog,
      gcpLogging: liveGcpLogging,
      github: liveGithub
    };
  }

  return {
    sentry: mockSentry,
    posthog: mockPosthog,
    gcpLogging: mockGcpLogging,
    github: mockGithub
  };
};
