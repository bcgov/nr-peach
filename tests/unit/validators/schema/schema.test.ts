import { Ajv } from 'ajv';

import { createAjvInstance, ensureSchemaId, loadSchema } from '../../../../src/validators/schema/schema.ts';

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

describe('ensureSchemaId', () => {
  it('should return the schema as-is if it already has an $id', () => {
    const input = {
      $id: 'existing-id',
      type: 'object',
      properties: { name: { type: 'string' } }
    };

    const result = ensureSchemaId(input);

    expect(result).toBe(input);
    expect(result.$id).toBe('existing-id');
  });

  it('should generate a deterministic $id if it is missing', () => {
    const input = {
      type: 'object',
      properties: { age: { type: 'number' } }
    };

    const result = ensureSchemaId(input);

    // Verify format: "schema:" followed by a 40-character hex hash (SHA-1)
    expect(result.$id).toMatch(/^schema:[a-f0-9]{40}$/);
    expect(result.type).toBe('object');
  });

  it('should produce the same ID for identical schemas', () => {
    const schemaA = { type: 'string', minLength: 5 };
    const schemaB = { type: 'string', minLength: 5 };

    const resultA = ensureSchemaId(schemaA);
    const resultB = ensureSchemaId(schemaB);

    expect(resultA.$id).toBe(resultB.$id);
  });

  it('should produce different IDs for different schemas', () => {
    const schemaA = { type: 'string' };
    const schemaB = { type: 'number' };

    const resultA = ensureSchemaId(schemaA);
    const resultB = ensureSchemaId(schemaB);

    expect(resultA.$id).not.toBe(resultB.$id);
  });

  it('should not mutate the original schema object', () => {
    const input = { type: 'boolean' };
    const inputCopy = { ...input };

    const result = ensureSchemaId(input);

    expect(input).not.toHaveProperty('$id');
    expect(input).toEqual(inputCopy);
    expect(result).not.toBe(input); // Should be a new object
  });
});

describe('loadSchema', () => {
  it('should load a schema from a URI and cache it', async () => {
    const schemaUri = 'https://example.com/foo.json';
    const schema = { type: 'object' };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    const result = await loadSchema(schemaUri);
    expect(result).toEqual(schema);
    expect(globalThis.fetch).toHaveBeenCalledWith(schemaUri);
  });

  it('should use the cached schema if available', async () => {
    const schemaUri = 'https://example.com/bar.json';
    const schema = { type: 'object' };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(schema)
    });

    // Load schema twice to test for caching
    await loadSchema(schemaUri);
    const result = await loadSchema(schemaUri);

    expect(result).toEqual(schema);
    expect(globalThis.fetch).toHaveBeenCalledWith(schemaUri);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if the schema cannot be loaded', async () => {
    const schemaUri = 'https://example.com/baz.json';

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(loadSchema(schemaUri)).rejects.toThrow(`Failed to load schema ${schemaUri}`);
  });
});
