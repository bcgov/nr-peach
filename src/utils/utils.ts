import { config } from 'dotenv';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { validate, version } from 'uuid';

import { getLogger } from './log.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });
const log = getLogger(import.meta.filename);

/**
 * Compares two objects to check if all keys and values in the second object exist in the first object.
 * @param lhs - The object to compare against.
 * @param rhs - The object containing keys and values to check.
 * @returns True if all keys and values in rhs exist in lhs, otherwise false.
 */
export function compareObject(lhs: Record<string, unknown>, rhs: Record<string, unknown>): boolean {
  return Object.keys(rhs).every((key) => rhs[key] == lhs[key]);
}

/**
 * Gets the current Git commit hash, or undefined if not found.
 * @see https://stackoverflow.com/a/34518749
 * @returns The git revision hash, or undefined
 */
export function getGitRevision(): string | undefined {
  try {
    // Check if GIT_COMMIT environment variable is set
    if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;

    // Resolve .git directory or file
    let gitDirPath = join(cwd(), '.git');
    if (!existsSync(gitDirPath)) {
      let i = 0;
      while (!existsSync(gitDirPath) && i < 5) {
        gitDirPath = join(cwd(), '../'.repeat(++i), '.git');
      }
    }

    // If .git is a file (worktree/submodule), read the actual git dir
    let gitDir = gitDirPath;
    if (
      existsSync(gitDirPath) &&
      statSync(gitDirPath).isFile() &&
      readFileSync(gitDirPath).toString().startsWith('gitdir:')
    ) {
      const gitDirFile = readFileSync(gitDirPath, 'utf8').trim();
      const match = /^gitdir: (.+)$/.exec(gitDirFile);
      if (match) gitDir = join(cwd(), match[1]);
    } else {
      // Do nothing if .git is a directory
    }

    const headPath = join(gitDir, 'HEAD');
    const head = readFileSync(headPath, 'utf8').trim();

    if (!head.startsWith('ref:')) return head;

    const refPath = join(gitDir, head.substring(5).trim());
    if (existsSync(refPath)) return readFileSync(refPath, 'utf8').trim();

    // Fallback: look in packed-refs
    const packedRefsPath = join(gitDir, 'packed-refs');
    if (existsSync(packedRefsPath)) {
      const packed = readFileSync(packedRefsPath, 'utf8');
      const refLine = packed.split('\n').find((line) => line.endsWith(head.substring(5).trim()));
      if (refLine) return refLine.split(' ')[0];
    }

    return undefined;
  } catch (error) {
    if (error instanceof Error) log.warn(error.message, { function: 'getGitRevision' });
    return undefined;
  }
}

/**
 * Returns the epoch timestamp in milliseconds from a valid UUIDv7 string.
 * @param uuid - UUIDv7 string
 * @returns Timestamp as a number, or undefined if the UUID is invalid or not version 7.
 */
export function getUUIDv7Timestamp(uuid: string): number | undefined {
  if (!validate(uuid) || version(uuid) !== 7) return undefined;

  const hexTimestamp = uuid.replaceAll('-', '').slice(0, 12);
  return parseInt(hexTimestamp, 16);
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
