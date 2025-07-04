import { existsSync, readFileSync, statSync } from 'node:fs';

import { getUUIDv7Timestamp, getGitRevision, sortObject } from '../../src/utils/utils.ts';

import type { Mock } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn()
}));

describe('getGitRevision', () => {
  const mockStat = (isFile: boolean) => ({
    isFile: () => isFile
  });

  it('returns the GIT_COMMIT environment variable if set', () => {
    process.env.GIT_COMMIT = 'envhash123';
    expect(getGitRevision()).toBe('envhash123');
    delete process.env.GIT_COMMIT;
  });

  it('returns the HEAD hash if HEAD is detached', () => {
    (existsSync as Mock).mockImplementation((path: string) => {
      // .git and HEAD exist
      return path.endsWith('.git') || path.endsWith('HEAD');
    });
    (statSync as Mock).mockReturnValue(mockStat(false)); // .git is a directory
    (readFileSync as Mock).mockImplementation((path: string) => {
      if (path.endsWith('HEAD')) return 'abcdef1234567890\n';
      return '';
    });

    expect(getGitRevision()).toBe('abcdef1234567890');
  });

  it('returns the commit hash from ref file if HEAD points to a ref', () => {
    (existsSync as Mock).mockImplementation((path: string) => {
      // .git, HEAD, and ref exist
      return path.endsWith('.git') || path.endsWith('HEAD') || path.endsWith('refs/heads/main');
    });
    (statSync as Mock).mockReturnValue(mockStat(false)); // .git is a directory
    (readFileSync as Mock).mockImplementation((path: string) => {
      if (path.endsWith('HEAD')) return 'ref: refs/heads/main\n';
      if (path.endsWith('refs/heads/main')) return '1234567890abcdef\n';
      return '';
    });

    expect(getGitRevision()).toBe('1234567890abcdef');
  });

  it('returns the commit hash from packed-refs if ref file does not exist', () => {
    (existsSync as Mock).mockImplementation((path: string) => {
      // .git, HEAD, packed-refs exist, but not the ref file
      return path.endsWith('.git') || path.endsWith('HEAD') || path.endsWith('packed-refs');
    });
    (statSync as Mock).mockReturnValue(mockStat(false)); // .git is a directory
    (readFileSync as Mock).mockImplementation((path: string) => {
      if (path.endsWith('HEAD')) return 'ref: refs/heads/main\n';
      if (path.endsWith('packed-refs')) return 'fedcba9876543210 refs/heads/main\n';
      return '';
    });

    expect(getGitRevision()).toBe('fedcba9876543210');
  });

  it('returns undefined if ref file does not exist', () => {
    (existsSync as Mock).mockImplementation((path: string) => {
      // .git, HEAD, packed-refs exist, but not the ref file
      return path.endsWith('.git') || path.endsWith('HEAD') || path.endsWith('packed-refs');
    });
    (statSync as Mock).mockReturnValue(mockStat(false)); // .git is a directory
    (readFileSync as Mock).mockImplementation((path: string) => {
      if (path.endsWith('HEAD')) return 'ref: refs/heads/main\n';
      return '';
    });

    expect(getGitRevision()).toBeUndefined();
  });

  it('returns undefined if .git does not exist', () => {
    (existsSync as Mock).mockReturnValue(false);

    expect(getGitRevision()).toBeUndefined();
  });

  it('returns undefined and logs warning if an error is thrown', () => {
    (existsSync as Mock).mockImplementation(() => {
      throw new Error('fs error');
    });

    expect(getGitRevision()).toBeUndefined();
  });

  it('resolves .git as a file (worktree/submodule) and reads gitdir', () => {
    (existsSync as Mock).mockImplementation((path: string) => {
      // .git file, HEAD, and ref exist
      return path.endsWith('.git') || path.endsWith('HEAD') || path.endsWith('refs/heads/feature');
    });
    (statSync as Mock).mockImplementation((path: string) => {
      // .git is a file
      return mockStat(path.endsWith('.git'));
    });
    (readFileSync as Mock).mockImplementation((path: string) => {
      if (path.endsWith('.git')) return 'gitdir: .git/worktrees/feature\n';
      if (path.endsWith('HEAD')) return 'ref: refs/heads/feature\n';
      if (path.endsWith('refs/heads/feature')) return 'cafebabe12345678\n';
      return '';
    });

    expect(getGitRevision()).toBe('cafebabe12345678');
  });
});

describe('getUUIDv7Timestamp', () => {
  it('should return the correct timestamp for a valid UUIDv7', () => {
    // Timestamp of 0x018e3c0d6cbb is 1710404496571 ms
    expect(getUUIDv7Timestamp('018e3c0d-6cbb-7000-8000-000000000000')).toBe(1710404496571);
  });

  it('should return undefined for an invalid UUID', () => {
    expect(getUUIDv7Timestamp('not-a-uuid')).toBeUndefined();
  });

  it('should return undefined for a valid UUID but not version 7', () => {
    expect(getUUIDv7Timestamp('007ea2a7-3994-4acf-8bcf-2a8ede9a2ccf')).toBeUndefined();
  });

  it('should return undefined for a malformed UUIDv7', () => {
    expect(getUUIDv7Timestamp('018e3c0d-6cbb-7cc0')).toBeUndefined();
  });
});

describe('sortObject', () => {
  it('should return a new object with keys sorted in ascending order', () => {
    const input = { b: 2, a: 1, c: 3 };
    const expected = { a: 1, b: 2, c: 3 };

    const result = sortObject(input);

    expect(result).toEqual(expected);
    expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
  });

  it('should handle an empty object', () => {
    const input = {};
    const expected = {};

    const result = sortObject(input);

    expect(result).toEqual(expected);
  });

  it('should not mutate the original object', () => {
    const input = { b: 2, a: 1, c: 3 };
    const inputCopy = { ...input };

    sortObject(input);

    expect(input).toEqual(inputCopy);
  });

  it('should work with nested objects', () => {
    const input = { b: { y: 2 }, a: { x: 1 } };
    const expected = { a: { x: 1 }, b: { y: 2 } };

    const result = sortObject(input);

    expect(result).toEqual(expected);
  });
});
