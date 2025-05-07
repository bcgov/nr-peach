import { getDocHTML } from '../../src/docs/index.ts';

describe('getDocHTML', () => {
  it('should return a valid HTML string with the default version', () => {
    const result = getDocHTML();

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html>');
    expect(result).toContain(
      '<title>NR Permitting Exchange, Aggregation and Collection Hub (PEACH) API - Documentation v1</title>'
    );
    // eslint-disable-next-line quotes
    expect(result).toContain("<redoc spec-url='/docs/openapi.yaml' />");
    expect(result).toContain(
      '<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>'
    );
  });

  it('should return a valid HTML string with a custom version', () => {
    const version = 'v2';
    const result = getDocHTML(version);

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html>');
    expect(result).toContain(
      `<title>NR Permitting Exchange, Aggregation and Collection Hub (PEACH) API - Documentation ${version}</title>`
    );
    // eslint-disable-next-line quotes
    expect(result).toContain("<redoc spec-url='/docs/openapi.yaml' />");
    expect(result).toContain(
      '<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>'
    );
  });
});
