import { getGitRevision } from './utils/index.ts';

import type { AuthMode } from './types/index.ts';

export const state: { authMode?: AuthMode; gitRev?: string; ready: boolean; shutdown: boolean } = {
  gitRev: getGitRevision(),
  ready: false,
  shutdown: false
};
