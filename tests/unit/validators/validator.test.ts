import * as integrity from '#src/validators/integrity/index';
import { createAjvInstance, ensureSchemaId, getPiesSchemaUri, loadSchema } from '#src/validators/schema/index';
import * as validator from '#src/validators/validator';
import type { RecordLinkage } from '#types';

import type { Mock } from 'vitest';

const { mockAjv, mockValidate } = vi.hoisted(() => {
  const mv = vi.fn();
  return {
    mockAjv: {
      compileAsync: vi.fn().mockResolvedValue(mv),
      getSchema: vi.fn()
    },
    mockValidate: mv
  };
});

vi.mock('#src/validators/schema/index', () => ({
  createAjvInstance: vi.fn().mockReturnValue(mockAjv),
  ensureSchemaId: vi.fn(<T>(schema: T extends object ? T : never) => ({
    ...schema,
    $id: `test-id-${Object.keys(schema).join('-')}`
  })),
  getPiesSchemaUri: vi.fn(),
  loadSchema: vi.fn(),
  pies: {
    spec: {
      message: { A: 'schema-a', B: 'schema-b' }
    }
  }
}));

vi.mock('#src/validators/integrity/index', () => ({
  integrityValidators: {
    recordLinkage: vi.fn()
  }
}));

describe('preCachePiesSchema', () => {
  it('should iterate through all pies message schemas and trigger compilation', async () => {
    (loadSchema as Mock).mockResolvedValue({ type: 'object' });
    (mockAjv.getSchema as Mock).mockReturnValue(undefined); // Force compilation path
    (mockAjv.compileAsync as Mock).mockResolvedValue(mockValidate.mockReturnValue(true));
    (getPiesSchemaUri as Mock).mockImplementation((val) => `uri-${val}`);

    await validator.preCachePiesSchema();

    expect(getPiesSchemaUri).toHaveBeenCalledWith('schema-a');
    expect(getPiesSchemaUri).toHaveBeenCalledWith('schema-b');

    // Verify that the underlying compilation mechanism was triggered for each schema.
    expect(loadSchema).toHaveBeenCalledWith('uri-schema-a');
    expect(loadSchema).toHaveBeenCalledWith('uri-schema-b');
    expect(mockAjv.compileAsync).toHaveBeenCalledTimes(2);
  });
});

describe('validateIntegrity', () => {
  it('should call the correct validator from integrityValidators', () => {
    const mockResult = { valid: true };
    (integrity.integrityValidators.recordLinkage as Mock).mockReturnValue(mockResult);

    const data = { some: 'data' } as unknown as RecordLinkage;
    const result = validator.validateIntegrity('recordLinkage', data);

    expect(integrity.integrityValidators.recordLinkage).toHaveBeenCalledWith(data);
    expect(result).toBe(mockResult);
  });

  it('should throw if the validator for the type does not exist', () => {
    const invalidType = 'invalidType' as keyof typeof integrity.integrityValidators;
    const data = {} as unknown as RecordLinkage;

    expect(() => {
      validator.validateIntegrity(invalidType, data);
    }).toThrow();
  });
});

describe('validateSchema', () => {
  beforeEach(() => {
    (createAjvInstance as Mock).mockReturnValue(mockAjv);
    (mockAjv.compileAsync as Mock).mockResolvedValue(mockValidate);
  });

  it('should compile and cache a string-based schema', async () => {
    const mockUri = 'https://schema.com/test.json';
    const mockSchemaDef = { type: 'object' };

    (loadSchema as Mock).mockResolvedValue(mockSchemaDef);
    (mockAjv.getSchema as Mock).mockReturnValueOnce(undefined).mockReturnValue(mockValidate);
    mockValidate.mockReturnValue(true);

    // First call: should compile
    const result1 = await validator.validateSchema(mockUri, { foo: 'bar' });
    expect(loadSchema).toHaveBeenCalledWith(mockUri);
    expect(mockAjv.compileAsync).toHaveBeenCalledWith(mockSchemaDef);
    expect(result1.valid).toBe(true);

    // Second call: should use cache (mockAjv.getSchema)
    const result2 = await validator.validateSchema(mockUri, { foo: 'bar' });
    expect(mockAjv.getSchema).toHaveBeenCalledWith(mockUri);
    expect(result2.valid).toBe(true);
    expect(mockAjv.compileAsync).toHaveBeenCalledTimes(1);
  });

  it('should handle validation errors correctly', async () => {
    const mockSchemaObj = { type: 'number' };
    const mockErrors = [{ message: 'should be number' }];
    const failingValidator = Object.assign(vi.fn().mockReturnValue(false), { errors: mockErrors });

    (mockAjv.getSchema as Mock).mockReturnValue(undefined);
    (mockAjv.compileAsync as Mock).mockResolvedValue(failingValidator);

    const result = await validator.validateSchema(mockSchemaObj, 'not-a-number');

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(mockErrors);
  });

  it('should use cache for object-based schemas', async () => {
    const mockSchemaObj = { type: 'string' };
    (mockAjv.getSchema as Mock).mockReturnValueOnce(undefined).mockReturnValue(mockValidate);
    mockValidate.mockReturnValue(true);

    // Call twice with the same object reference
    await validator.validateSchema(mockSchemaObj, 'test');
    await validator.validateSchema(mockSchemaObj, 'test');

    // compileAsync should only be called once for this object
    expect(mockAjv.compileAsync).toHaveBeenCalledTimes(1);
    expect(ensureSchemaId).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent requests for the same schema with a single compilation', async () => {
    const mockUri = 'https://schema.com/concurrent.json';
    const mockSchemaDef = { type: 'string' };
    (loadSchema as Mock).mockResolvedValue(mockSchemaDef);
    (mockAjv.getSchema as Mock).mockReturnValue(undefined);
    mockValidate.mockReturnValue(true);

    // Call validateSchema multiple times without awaiting
    const [result1, result2] = await Promise.all([
      validator.validateSchema(mockUri, 'test'),
      validator.validateSchema(mockUri, 'test')
    ]);
    expect(result1.valid).toBe(true);
    expect(result2.valid).toBe(true);

    // Check that loadSchema and compileAsync were only called once
    expect(loadSchema).toHaveBeenCalledTimes(1);
    expect(mockAjv.compileAsync).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors from schema loading and cleanup in-flight map', async () => {
    const mockUri = 'https://schema.com/failing.json';
    const error = new Error('Failed to load schema');
    (loadSchema as Mock).mockRejectedValue(error);
    (mockAjv.getSchema as Mock).mockReturnValue(undefined);

    await expect(validator.validateSchema(mockUri, 'test')).rejects.toThrow(error);
    expect(loadSchema).toHaveBeenCalledTimes(1);

    // Try again, it should try to load again since the in-flight promise was removed
    await expect(validator.validateSchema(mockUri, 'test')).rejects.toThrow(error);
    expect(loadSchema).toHaveBeenCalledTimes(2);
  });
});
