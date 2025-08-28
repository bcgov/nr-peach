import * as auditors from '../../../../src/validators/integrity/auditor.ts';
import { integrityValidators, IntegrityDefinitions } from '../../../../src/validators/integrity/integrity.ts';

import type { IntegrityError, Record, RecordLinkage } from '../../../../src/types/index.js';

describe('IntegrityDefinitions', () => {
  it('should be immutable and map keys correctly', () => {
    expect(IntegrityDefinitions.processEventSet).toBe('processEventSet');
    expect(IntegrityDefinitions.recordLinkage).toBe('recordLinkage');
    expect(Object.isFrozen(IntegrityDefinitions)).toBe(true);
  });
});

describe('integrityValidators', () => {
  const auditHeaderSpy = vi.spyOn(auditors, 'auditHeader');
  const auditProcessEventSpy = vi.spyOn(auditors, 'auditProcessEvent');

  describe('processEventSet', () => {
    const mockData: Record = {
      header: { id: '1', timestamp: '2024-01-01T00:00:00Z' },
      process_event: [{ code_system: 'sys', code: 'abc' }]
    } as unknown as Record;

    it('returns valid: true and no errors if no errors from auditors', () => {
      auditHeaderSpy.mockReturnValue([]);
      auditProcessEventSpy.mockReturnValue([]);

      const result = integrityValidators.processEventSet(mockData);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(auditHeaderSpy).toHaveBeenCalledWith(mockData);
      expect(auditProcessEventSpy).toHaveBeenCalledWith(mockData.process_event_set);
    });

    it('returns valid: false and errors if auditors return errors', () => {
      const headerErrors: IntegrityError[] = [{ message: 'header error' } as IntegrityError];
      const eventErrors: IntegrityError[] = [{ message: 'event error' } as IntegrityError];
      auditHeaderSpy.mockReturnValue(headerErrors);
      auditProcessEventSpy.mockReturnValue(eventErrors);

      const result = integrityValidators.processEventSet(mockData);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([...headerErrors, ...eventErrors]);
    });
  });

  describe('recordLinkage', () => {
    const mockData: RecordLinkage = {
      version: '1',
      kind: 'RecordLinkage',
      system_id: 'sys',
      record_id: 'rec-2',
      record_kind: 'Permit',
      transaction_id: '2',
      linked_record_id: '2024-01-02T00:00:00Z',
      linked_system_id: 'linked-sys',
      linked_record_kind: 'Permit'
    };

    it('returns valid: true and no errors if no errors from auditHeader', () => {
      auditHeaderSpy.mockReturnValue([]);

      const result = integrityValidators.recordLinkage(mockData);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(auditHeaderSpy).toHaveBeenCalledWith(mockData);
    });

    it('returns valid: false and errors if auditHeader returns errors', () => {
      const headerErrors: IntegrityError[] = [{ message: 'header error' } as IntegrityError];
      auditHeaderSpy.mockReturnValue(headerErrors);

      const result = integrityValidators.recordLinkage(mockData);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(headerErrors);
    });
  });
});
