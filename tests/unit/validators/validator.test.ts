import { createAjvInstance, loadSchema, getPiesSchemaUri } from '../../../src/validators/schema/index.ts';
import * as integrity from '../../../src/validators/integrity/index.ts';
import { validateSchema, validateIntegrity, preCachePiesSchema } from '../../../src/validators/validator.ts';

import type { Mock } from 'vitest';

vi.mock('../../../src/validators/schema/index.ts', () => ({
  createAjvInstance: vi.fn(),
  loadSchema: vi.fn(),
  getPiesSchemaUri: vi.fn(),
  pies: {
    spec: {
      message: {
        A: 'schema-a',
        B: 'schema-b'
      }
    }
  }
}));

vi.mock('../../../src/validators/integrity/index.ts', () => ({
  integrityValidators: {
    recordLinkage: vi.fn()
  }
}));

describe('preCachePiesSchema', () => {
  it('should iterate through all pies message schemas and trigger validation', async () => {
    (getPiesSchemaUri as Mock).mockImplementation((val) => `uri-${val}`);

    const mockAjv = {
      compileAsync: vi.fn().mockResolvedValue(vi.fn().mockReturnValue(true))
    };
    (createAjvInstance as Mock).mockReturnValue(mockAjv);
    (loadSchema as Mock).mockResolvedValue({});

    await preCachePiesSchema();

    expect(getPiesSchemaUri).toHaveBeenCalledWith('schema-a');
    expect(getPiesSchemaUri).toHaveBeenCalledWith('schema-b');
    expect(loadSchema).toHaveBeenCalledTimes(2);
  });
});

describe('validateIntegrity', () => {
  it('should call the correct validator from integrityValidators', () => {
    const mockResult = { valid: true };
    (integrity.integrityValidators.recordLinkage as Mock).mockReturnValue(mockResult);

    const data = { some: 'data' };
    const result = validateIntegrity('recordLinkage', data);

    expect(integrity.integrityValidators.recordLinkage).toHaveBeenCalledWith(data);
    expect(result).toBe(mockResult);
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
  it('should compile and cache a string-based schema', async () => {
    const mockUri = 'http://schema.com/test.json';
    const mockSchemaDef = { type: 'object' };
    const mockValidate = vi.fn().mockReturnValue(true);
    const mockAjv = {
      compileAsync: vi.fn().mockResolvedValue(mockValidate),
      getSchema: vi.fn().mockReturnValue(mockValidate)
    };

    (loadSchema as Mock).mockResolvedValue(mockSchemaDef);
    (createAjvInstance as Mock).mockReturnValue(mockAjv);

    // First call: should compile
    const result1 = await validateSchema(mockUri, { foo: 'bar' });

    expect(loadSchema).toHaveBeenCalledWith(mockUri);
    expect(mockAjv.compileAsync).toHaveBeenCalledWith(mockSchemaDef);
    expect(result1.valid).toBe(true);

    // Second call: should use cache (mockAjv.getSchema)
    await validateSchema(mockUri, { foo: 'bar' });
    expect(mockAjv.getSchema).toHaveBeenCalledWith(mockUri);
  });

  it('should handle validation errors correctly', async () => {
    const mockSchemaObj = { type: 'number' };
    const mockErrors = [{ message: 'should be number' }];
    const mockValidate = Object.assign(vi.fn().mockReturnValue(false), { errors: mockErrors });

    const mockAjv = {
      compileAsync: vi.fn().mockResolvedValue(mockValidate)
    };
    (createAjvInstance as Mock).mockReturnValue(mockAjv);

    const result = await validateSchema(mockSchemaObj, 'not-a-number');

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(mockErrors);
  });

  it('should use WeakMap cache for object-based schemas', async () => {
    const mockSchemaObj = { type: 'string' };
    const mockValidate = vi.fn().mockReturnValue(true);
    const mockAjv = {
      compileAsync: vi.fn().mockResolvedValue(mockValidate)
    };
    (createAjvInstance as Mock).mockReturnValue(mockAjv);

    // Call twice with the same object reference
    await validateSchema(mockSchemaObj, 'test');
    await validateSchema(mockSchemaObj, 'test');

    // Ajv instance should only be created once for this object
    expect(createAjvInstance).toHaveBeenCalledTimes(1);
  });
});
