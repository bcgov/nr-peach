import { getGitRevision } from '../../src/utils/utils.ts';

describe('getGitRevision', () => {
  it('should return a string', () => {
    expect(typeof getGitRevision()).toBe('string');
  });
});
