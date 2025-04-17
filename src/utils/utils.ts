import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { getLogger } from './log.ts';

const log = getLogger(import.meta.filename);

/**
 * Gets the current git revision hash
 * @see {@link https://stackoverflow.com/a/34518749}
 * @returns The git revision hash, or empty string
 */
export function getGitRevision(): string {
  try {
    const gitDir = ((): string => {
      let dir = '.git',
        i = 0;
      while (!existsSync(join(cwd(), dir)) && i < 5) {
        dir = '../' + dir;
        i++;
      }
      return dir;
    })();

    const head = readFileSync(join(cwd(), `${gitDir}/HEAD`), 'utf8')
      .toString()
      .trim();

    if (!head.includes(':')) {
      return head;
    } else {
      return readFileSync(join(cwd(), `${gitDir}/${head.substring(5)}`), 'utf8')
        .toString()
        .trim();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    log.warn(err.message, { function: 'getGitRevision' });
    return '';
  }
}
