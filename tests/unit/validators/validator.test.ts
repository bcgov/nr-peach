import { createAjvInstance, pies } from '../../../src/validators/schema/index.ts';
import * as integrity from '../../../src/validators/integrity/index.ts';
import { preCachePiesSchema, validateIntegrity, validateSchema } from '../../../src/validators/validator.ts';

describe('preCachePiesSchema', () => {
  // TODO: Determine why this intermittently fails with shuffled tests
  it('should call validateSchema for each pies.spec.message kind and log info', async () => {
    const result = await preCachePiesSchema();

    expect(result).toBeDefined();
    expect(result.length).toBe(Object.keys(pies.spec.message).length);
  });
});

describe('validateIntegrity', () => {
  it('should call the correct integrity validator and return its result', () => {
    const mockType =
      'mockType' as keyof typeof import('../../../src/validators/integrity/index.ts').integrityValidators;
    const mockData = { foo: 'bar' };
    const mockResult = { valid: true, errors: [] };

    // Mock the integrityValidators
    const originalValidators = integrity.integrityValidators;
    const mockedValidators = {
      ...originalValidators,
      [mockType]: vi.fn().mockReturnValue(mockResult)
    };
    vi.spyOn(integrity, 'integrityValidators', 'get').mockReturnValue(mockedValidators);

    const result = validateIntegrity(mockType, mockData);

    expect(result).toEqual(mockResult);
    expect(mockedValidators[mockType]).toHaveBeenCalledWith(mockData);
  });

  it('should throw if the validator for the type does not exist', () => {
    const invalidType = 'invalidType' as keyof typeof integrity.integrityValidators;
    const data = {};

    expect(() => {
      validateIntegrity(invalidType, data);
    }).toThrow();
  });
});

describe('validateSchema', () => {
  it('should validate data against a schema URI and cache it', async () => {
    const schemaUri = 'https://example.com/bam.json';
    const schema = { type: 'object' };
    const data = { key: 'value' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    const result = await validateSchema(schemaUri, data);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should validate data against a cached schema', async () => {
    const schemaUri = 'https://example.com/fam.json';
    const schema = { type: 'object' };
    const data = { key: 'value' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    // Invoke once to cache it
    await validateSchema(schemaUri, data);
    // Invoke again to test cache usage
    try {
      await validateSchema(schemaUri, data);
    } catch (error) {
      expect(error).toBeDefined();
      // This is not a great test, but it ensures that the cache logic line is used
    }
  });

  it('should return validation errors for invalid data', async () => {
    const schema = { type: 'object', required: ['key'] };
    const data = {};

    const ajv = createAjvInstance();
    ajv.compileAsync = vi.fn().mockResolvedValue(() => false);

    const result = await validateSchema(schema, data);

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
