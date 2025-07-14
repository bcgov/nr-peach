import { CodingDictionary } from '../../../src/utils/coding.ts';

const validCodeSystem = 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process';

describe('CodingDictionary', () => {
  it('should contain the expected code system', () => {
    expect(CodingDictionary).toHaveProperty(validCodeSystem);
  });

  it('should contain known codes with correct structure', () => {
    const codes = CodingDictionary[validCodeSystem];
    expect(codes).toHaveProperty('APPLICATION');
    expect(codes.APPLICATION).toEqual({
      codeSet: ['APPLICATION'],
      display: 'Application'
    });
  });
});
