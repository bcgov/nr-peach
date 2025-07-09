import { CodingDictionary, isValidCodeSystem, isValidCoding } from '../../../src/services/coding.ts';

const validCodeSystem = 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process';
const invalidCodeSystem = 'https://invalid-system';

describe('coding object', () => {
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

describe('isValidCodeSystem', () => {
  it('returns true for a valid code system', () => {
    expect(isValidCodeSystem(validCodeSystem)).toBe(true);
  });

  it('returns false for an invalid code system', () => {
    expect(isValidCodeSystem(invalidCodeSystem)).toBe(false);
  });
});

describe('isValidCoding', () => {
  it('returns true for a valid code in a valid code system', () => {
    expect(isValidCoding(validCodeSystem, 'APPLICATION')).toBe(true);
    expect(isValidCoding(validCodeSystem, 'ALLOWED')).toBe(true);
    expect(isValidCoding(validCodeSystem, 'TECHNICAL_REVIEW')).toBe(true);
  });

  it('returns false for an invalid code in a valid code system', () => {
    expect(isValidCoding(validCodeSystem, 'NOT_A_CODE')).toBe(false);
    expect(isValidCoding(validCodeSystem, '')).toBe(false);
  });

  it('returns false for a valid code in an invalid code system', () => {
    expect(isValidCoding(invalidCodeSystem, 'APPLICATION')).toBe(false);
  });

  it('returns false for an invalid code in an invalid code system', () => {
    expect(isValidCoding(invalidCodeSystem, 'NOT_A_CODE')).toBe(false);
  });
});
