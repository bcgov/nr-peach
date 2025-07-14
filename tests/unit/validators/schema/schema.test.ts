import { Ajv } from 'ajv';

import { createAjvInstance, loadSchema } from '../../../../src/validators/schema/schema.ts';

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

    await expect(loadSchema(schemaUri)).rejects.toThrow(`Failed to load schema ${schemaUri}`);
  });
});
