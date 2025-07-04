import { isValidCodeSystem, isValidCoding } from '../../src/services/coding.ts';
import { getUUIDv7Timestamp } from '../../src/utils/utils.ts';
import { validateIntegrity } from '../../src/validators/integrity.ts';

import type { Mock } from 'vitest';
import type { Event, ProcessEventSet, RecordLinkage } from '../../src/types/index.d.ts';

vi.mock('../../src/services/coding.ts', () => ({
  isValidCodeSystem: vi.fn(),
  isValidCoding: vi.fn()
}));

vi.mock('../../src/utils/utils.ts', async () => ({
  ...(await vi.importActual('../../src/utils/utils.ts')),
  getUUIDv7Timestamp: vi.fn()
}));

describe('validateIntegrity', () => {
  const validTransactionId = '018e0e6c-8e4d-7b7b-bb7b-7b7b7b7b7b7b';
  const now = Date.now();

  describe('processEventSet', () => {
    const baseProcessEventSet: ProcessEventSet = {
      transaction_id: validTransactionId,
      version: '0.1.0',
      kind: 'ProcessEventSet',
      system_id: 'test-system',
      record_id: 'test-record-id',
      record_kind: 'Permit',
      process_event: [
        {
          event: {} as Event,
          process: {
            code_system: 'systemA',
            code: 'codeA',
            code_set: ['setA']
          }
        }
      ]
    };

    it('returns valid: true when all checks pass', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(now - 1000);
      (isValidCodeSystem as Mock).mockReturnValue(true);
      (isValidCoding as Mock).mockReturnValue(true);

      const result = validateIntegrity('processEventSet', baseProcessEventSet);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('returns error if transaction_id is invalid (undefined timestamp)', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(undefined);
      (isValidCodeSystem as Mock).mockReturnValue(true);
      (isValidCoding as Mock).mockReturnValue(true);

      const result = validateIntegrity('processEventSet', baseProcessEventSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].key).toBe('transaction_id');
    });

    it('returns error if transaction_id timestamp is in the future', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(now + 100000);
      (isValidCodeSystem as Mock).mockReturnValue(true);
      (isValidCoding as Mock).mockReturnValue(true);

      const result = validateIntegrity('processEventSet', baseProcessEventSet);

      expect(result.valid).toBe(false);
      expect(result.errors?.[0].key).toBe('transaction_id');
    });

    it('returns error if code_system is invalid', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(now - 1000);
      (isValidCodeSystem as Mock).mockReturnValue(false);
      (isValidCoding as Mock).mockReturnValue(true);

      const result = validateIntegrity('processEventSet', baseProcessEventSet);

      expect(result.valid).toBe(false);
      expect(result.errors?.[0].key).toBe('code_system');
    });

    it('returns error if code is invalid', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(now - 1000);
      (isValidCodeSystem as Mock).mockReturnValue(true);
      (isValidCoding as Mock).mockReturnValue(false);

      const result = validateIntegrity('processEventSet', baseProcessEventSet);

      expect(result.valid).toBe(false);
      expect(result.errors?.[0].key).toBe('code');
    });

    it('returns multiple errors if both code_system and code are invalid', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(now - 1000);
      (isValidCodeSystem as Mock).mockReturnValue(false);
      (isValidCoding as Mock).mockReturnValue(false);

      const result = validateIntegrity('processEventSet', baseProcessEventSet);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors?.map((e) => e.key)).toEqual(expect.arrayContaining(['code_system', 'code']));
    });
  });

  describe('recordLinkage', () => {
    const baseRecordLinkage: RecordLinkage = {
      transaction_id: validTransactionId
      // other fields as needed
    } as RecordLinkage;

    it('returns valid: true when header is valid', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(now - 1000);

      const result = validateIntegrity('recordLinkage', baseRecordLinkage);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('returns error if header is invalid', () => {
      (getUUIDv7Timestamp as Mock).mockReturnValue(undefined);

      const result = validateIntegrity('recordLinkage', baseRecordLinkage);

      expect(result.valid).toBe(false);
      expect(result.errors?.[0].key).toBe('transaction_id');
    });
  });
});
