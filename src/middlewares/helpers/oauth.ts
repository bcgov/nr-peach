/**
 * Wraps an SPKI key with PEM header and footer
 * @param spki The PEM-encoded Simple public-key infrastructure string
 * @returns The PEM-encoded SPKI string with PEM header and footer
 */
export function spkiWrapper(spki: string): string {
  return `-----BEGIN PUBLIC KEY-----\n${spki}\n-----END PUBLIC KEY-----`;
}
