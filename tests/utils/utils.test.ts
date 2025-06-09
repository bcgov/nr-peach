import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getGitRevision, sortObject } from '../../src/utils/utils.ts';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}));

vi.mock('node:process', () => ({
  cwd: vi.fn(() => join('/', 'mocked', 'cwd'))
}));

describe('getGitRevision', () => {
  const gitHeadPath = join('/', 'mocked', 'cwd', '.git', 'HEAD');
  const gitRefPath = join('/', 'mocked', 'cwd', '.git', 'refs', 'heads', 'main');

  it('should return the git hash from HEAD when it does not contain a ref', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('mocked-hash');

    const result = getGitRevision();

    expect(result).toBe('mocked-hash');
    expect(readFileSync).toHaveBeenCalledWith(gitHeadPath, 'utf8');
  });

  it('should return the git hash from the ref file when HEAD contains a ref', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync)
      .mockImplementationOnce(() => 'ref: refs/heads/main')
      .mockImplementationOnce(() => 'mocked-ref-hash');

    const result = getGitRevision();

    expect(result).toBe('mocked-ref-hash');
    expect(readFileSync).toHaveBeenCalledWith(gitHeadPath, 'utf8');
    expect(readFileSync).toHaveBeenCalledWith(gitRefPath, 'utf8');
  });

  it('should return an empty string if the .git directory is not found', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = getGitRevision();

    expect(result).toBe('');
  });

  it('return an empty string if an error occurs', () => {
    vi.mocked(existsSync).mockImplementation(() => {
      throw new Error('mocked error');
    });

    const result = getGitRevision();

    expect(result).toBe('');
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
});
