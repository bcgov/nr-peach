import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { validate, version } from 'uuid';

import { getLogger } from './log.ts';

const log = getLogger(import.meta.filename);

/**
 * Performs a deep recursive check to determine if the `rhs` object is a subset of the `lhs` object.
 * - Returns `true` if every key in `rhs` exists in `lhs` with an equivalent value.
 * - Supports nested objects (recursive matching).
 * - Includes specialized string handling: if both strings contain a '-', they are
 * parsed as dates and compared by their numeric timestamps.
 * - `lhs` may contain additional keys not present in `rhs` without failing the check.
 * @param lhs - The base object (Left-Hand Side) acting as the superset.
 * @param rhs - The object (Right-Hand Side) containing the keys and values to match.
 * @returns `true` if all properties in `rhs` are satisfied by `lhs`; otherwise `false`.
 * @example
 * const lhs = { id: 101, status: 'active', meta: { lastLogin: '2024-05-01' } };
 * const rhs = { status: 'active', meta: { lastLogin: '2024-05-01T00:00:00Z' } };
 * containsSubset(lhs, rhs); // returns true
 */
export function containsSubset(lhs: Record<string, unknown>, rhs: Record<string, unknown>): boolean {
  return Object.keys(rhs).every((key) => {
    const rVal = rhs[key] ?? undefined;
    const lVal = lhs[key] ?? undefined;
    if (rVal === lVal) return true;

    if (typeof rVal === 'object' && rVal !== null && typeof lVal === 'object' && lVal !== null) {
      return containsSubset(lVal as Record<string, unknown>, rVal as Record<string, unknown>);
    }

    if (typeof rVal === 'string' && typeof lVal === 'string') {
      if (rVal.includes('-') && lVal.includes('-')) {
        const rTime = Date.parse(rVal);
        const lTime = Date.parse(lVal);

        if (!Number.isNaN(rTime) && !Number.isNaN(lTime)) return rTime === lTime;
      }
    }

    return false;
  });
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
