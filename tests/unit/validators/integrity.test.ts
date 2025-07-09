import * as services from '../../../src/services/index.ts';
import * as utils from '../../../src/utils/index.ts';
import { validateIntegrity } from '../../../src/validators/integrity.ts';

import type { ProcessEventSet, RecordLinkage } from '../../../src/types/index.d.ts';

describe('validateIntegrity', () => {
  const validTransactionId = '018e3e6a-8c3b-7b4c-8e2a-1b2c3d4e5f60';
  const now = Date.now();

  it('returns valid for a correct ProcessEventSet', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(now - 1000);
    vi.spyOn(services, 'isValidCodeSystem').mockReturnValue(true);
    vi.spyOn(services, 'isValidCoding').mockReturnValue(true);

    const pes: Partial<ProcessEventSet> = {
      transaction_id: validTransactionId,
      process_event: [
        {
          event: {
            start_datetime: '2024-01-01T00:00:00Z',
            end_datetime: '2024-01-02T00:00:00Z'
          },
          process: {
            code_system: 'TEST',
            code_set: ['123'],
            code: '123'
          }
        }
      ]
    };

    const result = validateIntegrity('processEventSet', pes);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('returns error for invalid transaction_id in ProcessEventSet', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(undefined);
    vi.spyOn(services, 'isValidCodeSystem').mockReturnValue(true);
    vi.spyOn(services, 'isValidCoding').mockReturnValue(true);

    const pes: Partial<ProcessEventSet> = {
      transaction_id: 'bad-uuid',
      process_event: [
        {
          event: {
            start_datetime: '2024-01-01T00:00:00Z',
            end_datetime: '2024-01-02T00:00:00Z'
          },
          process: {
            code_system: 'TEST',
            code_set: ['123'],
            code: '123'
          }
        }
      ]
    };

    const result = validateIntegrity('processEventSet', pes);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].key).toBe('transaction_id');
  });

  it('returns error for future transaction_id timestamp in ProcessEventSet', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(now + 100000);
    vi.spyOn(services, 'isValidCodeSystem').mockReturnValue(true);
    vi.spyOn(services, 'isValidCoding').mockReturnValue(true);

    const pes: Partial<ProcessEventSet> = {
      transaction_id: validTransactionId,
      process_event: [
        {
          event: {
            start_datetime: '2024-01-01T00:00:00Z',
            end_datetime: '2024-01-02T00:00:00Z'
          },
          process: {
            code_system: 'TEST',
            code_set: ['123'],
            code: '123'
          }
        }
      ]
    };

    const result = validateIntegrity('processEventSet', pes);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].key).toBe('transaction_id');
  });

  it('returns error for invalid code_system in ProcessEventSet', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(now - 1000);
    vi.spyOn(services, 'isValidCodeSystem').mockReturnValue(false);
    vi.spyOn(services, 'isValidCoding').mockReturnValue(true);

    const pes: Partial<ProcessEventSet> = {
      transaction_id: validTransactionId,
      process_event: [
        {
          event: {
            start_datetime: '2024-01-01T00:00:00Z',
            end_datetime: '2024-01-02T00:00:00Z'
          },
          process: {
            code_system: 'BAD',
            code_set: ['123'],
            code: '123'
          }
        }
      ]
    };

    const result = validateIntegrity('processEventSet', pes);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.key === 'code_system')).toBe(true);
  });

  it('returns error for invalid code in ProcessEventSet', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(now - 1000);
    vi.spyOn(services, 'isValidCodeSystem').mockReturnValue(true);
    vi.spyOn(services, 'isValidCoding').mockReturnValue(false);

    const pes: Partial<ProcessEventSet> = {
      transaction_id: validTransactionId,
      process_event: [
        {
          event: {
            start_datetime: '2024-01-01T00:00:00Z',
            end_datetime: '2024-01-02T00:00:00Z'
          },
          process: {
            code_system: 'TEST',
            code_set: ['BAD'],
            code: 'BAD'
          }
        }
      ]
    };

    const result = validateIntegrity('processEventSet', pes);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.key === 'code')).toBe(true);
  });

  it('returns error for event end before start in ProcessEventSet', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(now - 1000);
    vi.spyOn(services, 'isValidCodeSystem').mockReturnValue(true);
    vi.spyOn(services, 'isValidCoding').mockReturnValue(true);

    const pes: Partial<ProcessEventSet> = {
      transaction_id: validTransactionId,
      process_event: [
        {
          event: {
            start_datetime: '2024-01-02T00:00:00Z',
            end_datetime: '2024-01-01T00:00:00Z'
          },
          process: {
            code_system: 'TEST',
            code_set: ['123'],
            code: '123'
          }
        }
      ]
    };

    const result = validateIntegrity('processEventSet', pes);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.key === 'end_datetime' || e.key === 'end_date')).toBe(true);
  });

  it('returns valid for a correct RecordLinkage', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(now - 1000);

    const rl: Partial<RecordLinkage> = {
      transaction_id: validTransactionId
      // other fields as needed
    };

    const result = validateIntegrity('recordLinkage', rl);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('returns error for invalid transaction_id in RecordLinkage', () => {
    vi.spyOn(utils, 'getUUIDv7Timestamp').mockReturnValue(undefined);

    const rl: Partial<RecordLinkage> = {
      transaction_id: 'bad-uuid'
      // other fields as needed
    };

    const result = validateIntegrity('recordLinkage', rl);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].key).toBe('transaction_id');
  });
});
