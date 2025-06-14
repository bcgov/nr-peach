import { isValidCodeSystem, isValidCoding } from '../../src/services/coding.ts';
import { validateIntegrity } from '../../src/validators/integrity.ts';

import type { Mock } from 'vitest';
import type { ProcessEventSet, RecordLinkage } from '../../src/types/index.js';

vi.mock('../../src/services/coding.ts', () => ({
  isValidCodeSystem: vi.fn(),
  isValidCoding: vi.fn()
}));

describe('validateIntegrity', () => {
  describe('processEventSet validation', () => {
    it('should return valid when all process_event elements are valid', () => {
      const mockData: ProcessEventSet = {
        transaction_id: '12345',
        version: '1.0',
        kind: 'ProcessEventSet',
        record_id: '67890',
        record_kind: 'Permit',
        system_id: 'testSystem',
        process_event: [
          {
            event: {
              start_date: 'startDate'
            },
            process: { code_system: 'validCodeSystem', code: 'validCode', code_set: ['validCodeSet'] }
          }
        ]
      };

      (isValidCodeSystem as unknown as Mock).mockReturnValue(true);
      (isValidCoding as unknown as Mock).mockReturnValue(true);

      const result = validateIntegrity('processEventSet', mockData);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid when code_system is invalid', () => {
      const mockData: ProcessEventSet = {
        transaction_id: '12345',
        version: '1.0',
        kind: 'ProcessEventSet',
        record_id: '67890',
        record_kind: 'Permit',
        system_id: 'testSystem',
        process_event: [
          {
            event: {
              start_date: 'startDate'
            },
            process: { code_system: 'invalidCodeSystem', code: 'validCode', code_set: ['validCodeSet'] }
          }
        ]
      };

      (isValidCodeSystem as unknown as Mock).mockReturnValue(false);
      (isValidCoding as unknown as Mock).mockReturnValue(true);

      const result = validateIntegrity('processEventSet', mockData);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          {
            instancePath: '/process_event/0/process',
            message: 'Invalid Process in ProcessEvent element at index 0',
            key: 'code_system',
            value: 'invalidCodeSystem'
          }
        ])
      );
    });

    it('should return invalid when code is invalid', () => {
      const mockData: ProcessEventSet = {
        transaction_id: '12345',
        version: '1.0',
        kind: 'ProcessEventSet',
        record_id: '67890',
        record_kind: 'Permit',
        system_id: 'testSystem',
        process_event: [
          {
            event: {
              start_date: 'startDate'
            },
            process: { code_system: 'validCodeSystem', code: 'invalidCode', code_set: ['validCodeSet'] }
          }
        ]
      };

      (isValidCodeSystem as unknown as Mock).mockReturnValue(true);
      (isValidCoding as unknown as Mock).mockReturnValue(false);

      const result = validateIntegrity('processEventSet', mockData);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          {
            instancePath: '/process_event/0/process',
            message: 'Invalid Process in ProcessEvent element at index 0',
            key: 'code',
            value: 'invalidCode'
          }
        ])
      );
    });
  });

  describe('recordLinkage validation', () => {
    it('should return valid when RecordLinkage object is provided', () => {
      const mockData: RecordLinkage = {} as RecordLinkage;

      const result = validateIntegrity('recordLinkage', mockData);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid when RecordLinkage object is null or undefined', () => {
      const mockData: RecordLinkage = null as unknown as RecordLinkage;

      const result = validateIntegrity('recordLinkage', mockData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeUndefined();
    });
  });
});
