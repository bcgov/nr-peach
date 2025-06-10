import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { getLogger } from './log.ts';

const log = getLogger(import.meta.filename);

/**
 * Gets the current git revision hash
 * @see https://stackoverflow.com/a/34518749
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
  } catch (error) {
    if (error instanceof Error) {
      log.warn(error.message, { function: 'getGitRevision' });
    }
    return '';
  }
}

/**
 * Sorts an object's keys in ascending order and returns a new object.
 * @param obj - The object to sort.
 * @returns A new object with sorted keys.
 */
export function sortObject<T extends object>(obj: T): T {
  return (Object.keys(obj) as (keyof T)[])
    .sort((a, b) => String(a).localeCompare(String(b)))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as T);
}
