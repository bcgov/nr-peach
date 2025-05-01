import { Ajv } from 'ajv';

import {
  createAjvInstance,
  loadSchema,
  validateSchema
} from '../../src/validators/index.ts';

describe('createAjvInstance', () => {
  it('should create an Ajv instance with default options', () => {
    const ajv = createAjvInstance();
    expect(ajv).toBeInstanceOf(Ajv);
  });

  it('should create an Ajv instance with custom options', () => {
    const ajv = createAjvInstance({ strict: false });
    expect(ajv.opts.strict).toBe(false);
  });
});

describe('loadSchema', () => {
  it('should load a schema from a URI and cache it', async () => {
    const schemaUri = 'https://example.com/foo.json';
    const schema = { type: 'object' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    const result = await loadSchema(schemaUri);
    expect(result).toEqual(schema);
    expect(global.fetch).toHaveBeenCalledWith(schemaUri);
  });

  // TODO: Add test to check if cache is being used

  it('should throw an error if the schema cannot be loaded', async () => {
    const schemaUri = 'https://example.com/baz.json';

    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(loadSchema(schemaUri)).rejects.toThrow(
      `Failed to load schema ${schemaUri}`
    );
  });
});

describe('validateSchema', () => {
  it('should validate data against a cached schema', async () => {
    const schemaUri = 'https://example.com/bam.json';
    const schema = { type: 'object' };
    const data = { key: 'value' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    const ajv = createAjvInstance();
    ajv.compileAsync = vi.fn().mockResolvedValue(() => true);
    vi.spyOn(ajv, 'getSchema');

    const result = await validateSchema(schemaUri, data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should validate data against a non-cached schema', async () => {
    const schema = { type: 'object' };
    const data = { key: 'value' };

    const ajv = createAjvInstance();
    ajv.compileAsync = vi.fn().mockResolvedValue(() => true);

    const result = await validateSchema(schema, data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
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
