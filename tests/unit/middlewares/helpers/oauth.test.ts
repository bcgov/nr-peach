import { spkiWrapper } from '../../../../src/middlewares/helpers/oauth.ts';

describe('spkiWrapper', () => {
  it('returns the PEM format we expect', () => {
    const spki = 'someverylongmultilinedpublickeyvalue';

    const result = spkiWrapper(spki);

    expect(result).toBeTruthy();
    expect(result).toBeTypeOf('string');
    expect(result).toEqual(`-----BEGIN PUBLIC KEY-----\n${spki}\n-----END PUBLIC KEY-----`);
  });
});
