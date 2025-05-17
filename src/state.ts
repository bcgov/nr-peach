import { getGitRevision } from './utils/index.ts';

export const state = {
  gitRev: getGitRevision(),
  ready: false,
  shutdown: false
};
