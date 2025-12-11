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
  const findGitDir = (base: string): string | undefined => {
    let gitPath = join(base, '.git');
    if (existsSync(gitPath)) return gitPath;

    for (let i = 1; i <= 5; i++) {
      gitPath = join(base, '../'.repeat(i), '.git');
      if (existsSync(gitPath)) return gitPath;
    }

    return undefined;
  };

  const resolveGitDir = (gitPath: string): string => {
    if (!statSync(gitPath).isFile()) return gitPath;

    const content = readFileSync(gitPath, 'utf8').trim();
    const match = /^gitdir: (.+)$/.exec(content);
    return match ? join(cwd(), match[1]) : gitPath;
  };

  const readRef = (gitDir: string, ref: string): string | undefined => {
    const refPath = join(gitDir, ref);
    return existsSync(refPath) ? readFileSync(refPath, 'utf8').trim() : undefined;
  };

  const readPackedRef = (gitDir: string, ref: string): string | undefined => {
    const packedPath = join(gitDir, 'packed-refs');
    if (!existsSync(packedPath)) return undefined;

    const refName = ref.trim();
    const line = readFileSync(packedPath, 'utf8')
      .split('\n')
      .find((l) => l.endsWith(refName));

    return line ? line.split(' ')[0] : undefined;
  };

  try {
    if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;

    const gitPath = findGitDir(cwd());
    if (!gitPath) return undefined;

    const gitDir = resolveGitDir(gitPath);
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();

    if (!head.startsWith('ref:')) return head;

    const ref = head.slice(5).trim();

    return readRef(gitDir, ref) ?? readPackedRef(gitDir, ref) ?? undefined;
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
  return Number.parseInt(hexTimestamp, 16);
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
