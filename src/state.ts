import { getAuthMode } from './middlewares/helpers/oauth.ts';
import { getGitRevision } from './utils/index.ts';

export const state = {
  authMode: getAuthMode(),
  gitRev: getGitRevision(),
  ready: false,
  shutdown: false
};
