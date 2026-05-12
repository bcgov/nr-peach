import * as utils from '#src/utils/index';
import { auditEvent, auditHeader, auditProcess, auditProcessEvent } from '#src/validators/integrity/auditor';

import type { Header, Process, ProcessEvent } from '#types';

vi.mock('#src/utils/coding', () => ({
  CodingDictionary: {
    SYSTEM_A: { CODE1: 'desc1', CODE2: 'desc2' },
    SYSTEM_B: { CODE3: 'desc3' }
  }
}));

describe('auditEvent', () => {
  it('returns no errors for valid event with start_datetime and end_datetime', () => {
    const event = { start_datetime: '1000', end_datetime: '2000' };
    expect(auditEvent(event, 0)).toEqual([]);
  });

  it('returns error if end_datetime < start_datetime', () => {
    const event = { start_datetime: '2000', end_datetime: '1000' };
    expect(auditEvent(event, 1)).toEqual([
      {
        instancePath: '/process_event_set/1/event',
        message: 'Invalid Event in ProcessEvent element at index 1',
        key: 'end_datetime',
        value: '1000'
      }
    ]);
  });

  it('returns error if end_date < start_date', () => {
    const event = { start_date: '5', end_date: '2' };
    expect(auditEvent(event, 2)).toEqual([
      {
        instancePath: '/process_event_set/2/event',
        message: 'Invalid Event in ProcessEvent element at index 2',
        key: 'end_date',
        value: '2'
      }
    ]);
  });

  it('returns no error if end_date is undefined', () => {
    const event = { start_date: '5' };
    expect(auditEvent(event, 0)).toEqual([]);
  });
});

describe('auditHeader', () => {
  const getUUIDv7TimestampSpy = vi.spyOn(utils, 'getUUIDv7Timestamp');

  it('returns no errors for valid transaction_id timestamp', () => {
    getUUIDv7TimestampSpy.mockReturnValue(Date.now() - 1000);
    const header = { transaction_id: 'uuid' } as Header;
    expect(auditHeader(header)).toEqual([]);
  });

  it('returns error if getUUIDv7Timestamp returns undefined', () => {
    getUUIDv7TimestampSpy.mockReturnValue(undefined);
    const header = { transaction_id: 'bad-uuid' } as Header;
    expect(auditHeader(header)).toEqual([
      {
        instancePath: '/transaction_id',
        message: 'Invalid Header element',
        key: 'transaction_id',
        value: 'bad-uuid'
      }
    ]);
  });

  it('returns error if timestamp is in the future', () => {
    getUUIDv7TimestampSpy.mockReturnValue(Date.now() + 100000);
    const header = { transaction_id: 'future-uuid' } as Header;
    expect(auditHeader(header)).toEqual([
      {
        instancePath: '/transaction_id',
        message: 'Invalid Header element',
        key: 'transaction_id',
        value: 'future-uuid'
      }
    ]);
  });
});

describe('auditProcess', () => {
  it('returns no errors for valid code_system and code', () => {
    const process = { code_system: 'SYSTEM_A', code: 'CODE1' } as Process;
    expect(auditProcess(process, 0)).toEqual([]);
  });

  it('returns error for invalid code_system', () => {
    const process = { code_system: 'INVALID', code: 'CODE1' } as Process;
    expect(auditProcess(process, 1)).toEqual([
      {
        instancePath: '/process_event_set/1/process',
        message: 'Invalid Process in ProcessEvent element at index 1',
        key: 'code_system',
        value: 'INVALID'
      },
      {
        instancePath: '/process_event_set/1/process',
        message: 'Invalid Process in ProcessEvent element at index 1',
        key: 'code',
        value: 'CODE1'
      }
    ]);
  });

  it('returns error for invalid code in valid code_system', () => {
    const process = { code_system: 'SYSTEM_A', code: 'INVALID' } as Process;
    expect(auditProcess(process, 2)).toEqual([
      {
        instancePath: '/process_event_set/2/process',
        message: 'Invalid Process in ProcessEvent element at index 2',
        key: 'code',
        value: 'INVALID'
      }
    ]);
  });
});

describe('auditProcessEvent', () => {
  it('returns empty array when process_event_set is undefined', () => {
    expect(auditProcessEvent()).toEqual([]);
  });

  it('skips undefined process events', () => {
    const pes = [
      undefined,
      {
        event: { start_datetime: '1', end_datetime: '2' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      }
    ] as unknown as ProcessEvent[];

    expect(auditProcessEvent(pes)).toEqual([]);
  });

  it('returns combined errors from auditEvent and auditProcess', () => {
    const pes: ProcessEvent[] = [
      {
        event: { start_datetime: '6', end_datetime: '5' },
        process: { code_set: ['INVALID'], code_system: 'INVALID', code: 'INVALID' }
      },
      {
        event: { start_datetime: '1', end_datetime: '2' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      }
    ];
    const errors = auditProcessEvent(pes);
    expect(errors).toEqual([
      {
        instancePath: '/process_event_set/0/event',
        message: 'Invalid Event in ProcessEvent element at index 0',
        key: 'end_datetime',
        value: '5'
      },
      {
        instancePath: '/process_event_set/0/process',
        message: 'Invalid Process in ProcessEvent element at index 0',
        key: 'code_system',
        value: 'INVALID'
      },
      {
        instancePath: '/process_event_set/0/process',
        message: 'Invalid Process in ProcessEvent element at index 0',
        key: 'code',
        value: 'INVALID'
      }
    ]);
  });

  it('returns empty array if all events and processes are valid', () => {
    const pes: ProcessEvent[] = [
      {
        event: { start_datetime: '1', end_datetime: '2' },
        process: { code_set: ['CODE2'], code_system: 'SYSTEM_A', code: 'CODE2' }
      }
    ];
    expect(auditProcessEvent(pes)).toEqual([]);
  });

  it('returns duplicate process.code error when same code appears more than once', () => {
    const pes: ProcessEvent[] = [
      {
        event: { start_datetime: '1', end_datetime: '2' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      },
      {
        event: { start_datetime: '3', end_datetime: '4' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      }
    ];

    expect(auditProcessEvent(pes)).toEqual([
      {
        instancePath: '/process_event_set',
        key: 'process.code',
        params: {
          duplicateCount: 2,
          duplicateIndices: [0, 1]
        },
        value: 'CODE1',
        message: 'must NOT have duplicate items (items 0 and 1 are identical)'
      }
    ]);
  });

  it('returns duplicate errors per repeated code and includes all duplicate indices', () => {
    const pes: ProcessEvent[] = [
      {
        event: { start_datetime: '1', end_datetime: '2' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      },
      {
        event: { start_datetime: '3', end_datetime: '4' },
        process: { code_set: ['CODE2'], code_system: 'SYSTEM_A', code: 'CODE2' }
      },
      {
        event: { start_datetime: '5', end_datetime: '6' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      },
      {
        event: { start_datetime: '7', end_datetime: '8' },
        process: { code_set: ['CODE2'], code_system: 'SYSTEM_A', code: 'CODE2' }
      },
      {
        event: { start_datetime: '09', end_datetime: '10' },
        process: { code_set: ['CODE1'], code_system: 'SYSTEM_A', code: 'CODE1' }
      }
    ];

    expect(auditProcessEvent(pes)).toEqual([
      {
        instancePath: '/process_event_set',
        key: 'process.code',
        params: {
          duplicateCount: 3,
          duplicateIndices: [0, 2, 4]
        },
        value: 'CODE1',
        message: 'must NOT have duplicate items (items 0, 2, and 4 are identical)'
      },
      {
        instancePath: '/process_event_set',
        key: 'process.code',
        params: {
          duplicateCount: 2,
          duplicateIndices: [1, 3]
        },
        value: 'CODE2',
        message: 'must NOT have duplicate items (items 1 and 3 are identical)'
      }
    ]);
  });

  it('treats a code system with no codes as valid system but invalid code', async () => {
    vi.resetModules();
    vi.doMock('#src/utils/index', async () => {
      const actual = await vi.importActual<typeof import('#src/utils/index')>('#src/utils/index');
      return {
        ...actual,
        CodingDictionary: {
          SYSTEM_A: { CODE1: 'desc1' },
          SYSTEM_EMPTY: undefined
        }
      };
    });

    const { auditProcess: isolatedAuditProcess } = await import('#src/validators/integrity/auditor');

    expect(isolatedAuditProcess({ code_system: 'SYSTEM_EMPTY', code: 'MISSING_CODE' } as Process, 0)).toEqual([
      {
        instancePath: '/process_event_set/0/process',
        message: 'Invalid Process in ProcessEvent element at index 0',
        key: 'code',
        value: 'MISSING_CODE'
      }
    ]);

    vi.resetModules();
  });
});
