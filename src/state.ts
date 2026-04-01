import { getGitRevision } from '#src/utils/index';

import type { AuthMode } from '#types';

export const state: { authMode?: AuthMode; gitRev?: string; ready: boolean; shutdown: boolean } = {
  gitRev: getGitRevision(),
  ready: false,
  shutdown: false
};
