//  * Fetches an OAuth2 bearer token using client credentials.
//  * @param clientId - The client identifier issued by the authorization server.
//  * @param secret - The client secret used for authentication.
//  * @param token_endpoint - The URL of the authorization server's token endpoint.
//  * @returns The bearer token as a string, or null if the token could not be fetched.
//  */
// export function fetchBearerToken(clientId: string, secret: string, token_endpoint: string): string | null {
/**
 * Fetches an OAuth2 bearer token using client credentials.
 * @returns The bearer token as a string, or null if the token could not be fetched.
 */
export function fetchBearerToken(): string | null {
  const bearerToken = '';
  return bearerToken;
}

/**
 * Generates a random integer between the specified `min` and `max` values, inclusive.
 * @param min - The minimum integer value that can be returned.
 * @param max - The maximum integer value that can be returned.
 * @returns A random integer between `min` and `max`, inclusive.
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Returns a random item from the provided array.
 * @param arrayOfItems - The array of items to select from.
 * @returns A randomly selected item from the array.
 */
export function randomItem<T>(arrayOfItems: readonly T[]): T {
  return arrayOfItems[Math.floor(Math.random() * arrayOfItems.length)];
}

/**
 * Generates a random string of the specified length using characters from the given charset.
 * @param length - The desired length of the generated string.
 * @param charset - The set of characters to use for generating the string. Defaults to lowercase English letters.
 * @returns A randomly generated string of the specified length.
 */
export function randomString(length: number, charset = 'abcdefghijklmnopqrstuvwxyz'): string {
  let res = '';
  while (length--) res += charset[Math.floor(Math.random() * charset.length)];
  return res;
}

/**
 * Filters an array of objects to remove duplicates based on a specific key.
 * Keeps the first occurrence of each unique key.
 * @param a - The array of objects to filter.
 * @param key - A function that extracts the key from each object for comparison.
 * @returns A new array with duplicates removed, keeping the first occurrence.
 */
export function uniqByKeepFirst<T>(a: T[], key: (item: T) => unknown): T[] {
  const seen = new Set();
  return a.filter((item) => {
    const k = key(item);
    return seen.has(k) ? false : seen.add(k);
  });
}

/**
 * Generates a UUID version 7 (UUIDv7) string.
 *
 * UUIDv7 is a time-ordered UUID format that includes a 48-bit timestamp (milliseconds since Unix epoch),
 * 12 bits of random data, and 62 bits of additional random data, following the draft specification:
 * https://datatracker.ietf.org/doc/html/draft-ietf-uuidrev-rfc4122bis-10#section-5.7
 *
 * The resulting UUID string is formatted as: `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`
 * where:
 * - The first 12 hex digits represent the timestamp.
 * - The 13th hex digit is always '7' to indicate version 7.
 * - The 17th hex digit is set to one of '8', '9', 'a', or 'b' to indicate the variant.
 * - The remaining digits are random.
 * @returns A randomly generated UUIDv7 string.
 */
export function uuidv7(): string {
  const now = Date.now();
  const unixTsMs = BigInt(now);
  // UUIDv7: 48 bits timestamp, 12 bits random, 62 bits random
  // Layout: https://datatracker.ietf.org/doc/html/draft-ietf-uuidrev-rfc4122bis-10#section-5.7

  // 48 bits timestamp (milliseconds since Unix epoch)
  const tsHex = unixTsMs.toString(16).padStart(12, '0');

  // 12 bits random
  const rand12 = Math.floor(Math.random() * 0x1000)
    .toString(16)
    .padStart(3, '0');

  // 62 bits random (16 hex chars = 64 bits, but we use only 62 bits)
  const rand62 = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  // Compose UUIDv7: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
  // Version (7) in 13th hex digit, variant (10xx) in 17th hex digit
  const uuid =
    tsHex.slice(0, 8) +
    '-' +
    tsHex.slice(8, 12) +
    '-' +
    '7' +
    rand12.slice(0, 3) +
    '-' +
    ((Number.parseInt(rand62[0], 16) & 0x3) | 0x8).toString(16) +
    rand62.slice(1, 4) +
    '-' +
    rand62.slice(4, 16);

  return uuid;
}
