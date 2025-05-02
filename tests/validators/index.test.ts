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
    expect(ajv.opts.allErrors).toBeTruthy();
    expect(ajv.opts.coerceTypes).toBeTruthy();
    expect(ajv.opts.loadSchema).toBeDefined();
  });

  it('should create an Ajv instance with custom options', () => {
    const ajv = createAjvInstance({ strict: false });
    expect(ajv).toBeInstanceOf(Ajv);
    expect(ajv.opts.allErrors).toBeTruthy();
    expect(ajv.opts.coerceTypes).toBeTruthy();
    expect(ajv.opts.loadSchema).toBeDefined();
    expect(ajv.opts.strict).toBeFalsy();
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

  it('should use the cached schema if available', async () => {
    const schemaUri = 'https://example.com/bar.json';
    const schema = { type: 'object' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    // Load schema twice to test for caching
    await loadSchema(schemaUri);
    const result = await loadSchema(schemaUri);

    expect(result).toEqual(schema);
    expect(global.fetch).toHaveBeenCalledWith(schemaUri);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Fetch should only be called once
  });

  it('should throw an error if the schema cannot be loaded', async () => {
    const schemaUri = 'https://example.com/baz.json';

    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(loadSchema(schemaUri)).rejects.toThrow(
      `Failed to load schema ${schemaUri}`
    );
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

  it.skip('should validate data against a cached schema', async () => {
    const schemaUri = 'https://example.com/fam.json';
    const schema = { type: 'object' };
    const data = { key: 'value' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    // TODO: Fix mocking to load schema twice to test for caching
    await validateSchema(schemaUri, data);
    const result = await validateSchema(schemaUri, data);

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
