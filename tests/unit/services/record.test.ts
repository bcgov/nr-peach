// Always import repository.helper.ts and helpers/index.ts first to ensure mocks are set up
import { baseRepositoryMock, executeMock } from './repository.helper.ts';
import {
  cacheableRead,
  cacheableUpsert,
  dateTimePartsToEvent,
  eventToDateTimeParts,
  transactionWrapper
} from '../../../src/services/helpers/index.ts';

import {
  CodingRepository,
  OnHoldEventRepository,
  ProcessEventRepository,
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../../../src/repositories/index.ts';
import {
  findRecordService,
  mergeRecordService,
  pruneRecordService,
  replaceRecordService
} from '../../../src/services/record.ts';

import type { Selectable } from 'kysely';
import type { Mock } from 'vitest';
import type { PiesSystemRecord, Record } from '../../../src/types/index.d.ts';

describe('recordService', () => {
  const systemRecord = {
    id: 1,
    recordKindId: 2,
    systemId: 'sys-1',
    recordId: 'rec-1'
  } as Selectable<PiesSystemRecord>;

  describe('findRecordService', () => {
    const processEventsRaw = [
      {
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00',
        codingId: 10,
        status: 'active',
        statusCode: 'A',
        statusDescription: 'Active'
      }
    ];

    beforeEach(() => {
      // Use a mock that returns the call count as the returned id
      let readCallCount = 0;
      (cacheableRead as Mock).mockImplementation(() => {
        readCallCount += 1;
        return Promise.resolve({
          id: readCallCount,
          code: 'APPLICATION',
          codeSystem: 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process',
          kind: 'Permit',
          versionId: 'v1'
        });
      });

      (dateTimePartsToEvent as Mock).mockReturnValue({
        start_datetime: '2024-01-01T00:00:00Z',
        end_datetime: '2024-01-01T01:00:00Z'
      });

      executeMock.execute.mockResolvedValue([]);
    });

    it('should return a Record when events are found', async () => {
      executeMock.execute.mockResolvedValue(processEventsRaw);

      const result = await findRecordService(systemRecord);

      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(cacheableRead).toHaveBeenNthCalledWith(1, new RecordKindRepository(), systemRecord.recordKindId);
      expect(cacheableRead).toHaveBeenNthCalledWith(2, new CodingRepository(), processEventsRaw[0].codingId);
      expect(ProcessEventRepository).toHaveBeenCalledTimes(1);
      expect(ProcessEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(result).toMatchObject({
        kind: 'Record',
        system_id: systemRecord.systemId,
        record_id: systemRecord.recordId,
        record_kind: 'Permit',
        version: 'v1',
        on_hold_event_set: [
          {
            coding: {
              code: expect.any(String) as string,
              code_display: expect.any(String) as string,
              code_set: expect.arrayContaining([expect.any(String) as string]) as
                | [string]
                | [string, string]
                | [string, string, string],
              code_system: expect.any(String) as string
            },
            event: {
              start_datetime: '2024-01-01T00:00:00Z',
              end_datetime: '2024-01-01T01:00:00Z'
            }
          }
        ],
        process_event_set: [
          {
            event: {
              start_datetime: '2024-01-01T00:00:00Z',
              end_datetime: '2024-01-01T01:00:00Z'
            },
            process: {
              code: expect.any(String) as string,
              code_display: expect.any(String) as string,
              code_set: expect.arrayContaining(['APPLICATION']) as
                | [string]
                | [string, string]
                | [string, string, string],
              code_system: expect.any(String) as string,
              status: expect.any(String) as string,
              status_code: expect.any(String) as string,
              status_description: expect.any(String) as string
            }
          }
        ]
      });
    });

    it('should throw Problem 404 if no record kind found', async () => {
      (cacheableRead as Mock).mockRejectedValueOnce(new Error('not found'));
      await expect(findRecordService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No process events found.'
      });
    });

    it('should throw Problem 404 if no process events found', async () => {
      await expect(findRecordService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No process events found.'
      });
    });

    it('should throw Problem 404 if no coding found for on hold event', async () => {
      executeMock.execute.mockResolvedValue([
        {
          startDate: '2024-01-01',
          startTime: '00:00:00',
          endDate: '2024-01-01',
          endTime: '01:00:00'
        }
      ]);
      (cacheableRead as Mock)
        .mockImplementationOnce(() => {
          return Promise.resolve({ id: 1 });
        })
        .mockImplementationOnce(() => {
          return Promise.reject(new Error('not found'));
        });

      await expect(() => findRecordService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No valid on hold codings found.'
      });
    });

    it('should throw Problem 404 if no coding found for process event', async () => {
      executeMock.execute.mockResolvedValue([
        {
          startDate: '2024-01-01',
          startTime: '00:00:00',
          endDate: '2024-01-01',
          endTime: '01:00:00'
        }
      ]);
      (cacheableRead as Mock)
        .mockImplementationOnce(() => {
          return Promise.resolve({ id: 1 });
        })
        .mockImplementationOnce(() => {
          return Promise.resolve({
            id: 2,
            code: 'MISSING_INFORMATION',
            codeSystem: 'https://bcgov.github.io/nr-pies/docs/spec/code_system/on_hold_process',
            kind: 'Permit',
            versionId: 'v1'
          });
        })
        .mockImplementationOnce(() => {
          return Promise.reject(new Error('not found'));
        });

      await expect(() => findRecordService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No valid process codings found.'
      });
    });
  });

  describe('mergeRecordService', () => {
    it('should throw a not implemented error', () => {
      expect(() => mergeRecordService({} as Record)).toThrowError('mergeRecordService not implemented');
    });
  });

  describe('pruneRecordService', () => {
    it('should call prune on OnHoldEventRepository and ProcessEventRepository', async () => {
      executeMock.execute.mockResolvedValue([]);
      const pruneMock = vi.fn().mockImplementation(() => executeMock);
      (OnHoldEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });
      (ProcessEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });

      const result = await pruneRecordService(systemRecord);

      expect(result).toEqual([[], []]);
      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(OnHoldEventRepository).toHaveBeenCalledTimes(1);
      expect(OnHoldEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(ProcessEventRepository).toHaveBeenCalledTimes(1);
      expect(ProcessEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(pruneMock).toHaveBeenCalledWith(systemRecord.id);
      expect(executeMock.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('replaceRecordService', () => {
    const record: Record = {
      transaction_id: 'uuid-mock',
      version: 'v1',
      kind: 'Record',
      system_id: 'sys-1',
      record_id: 'rec-1',
      record_kind: 'Permit',
      on_hold_event_set: [
        {
          coding: {
            code: '123',
            code_display: 'Test Display',
            code_set: ['123'],
            code_system: 'SOMECODESYSTEM'
          },
          event: { start_datetime: '2024-01-01T00:00:00Z', end_datetime: '2024-01-01T01:00:00Z' }
        }
      ],
      process_event_set: [
        {
          event: { start_datetime: '2024-01-01T00:00:00Z', end_datetime: '2024-01-01T01:00:00Z' },
          process: {
            code: '123',
            code_display: 'Test Display',
            code_set: ['123'],
            code_system: 'SOMECODESYSTEM',
            status: 'active',
            status_code: 'A',
            status_description: 'Active'
          }
        }
      ]
    };

    const pruneMock = vi.fn();

    beforeEach(() => {
      // Use a mock that returns the call count as the returned id
      let upsertCallCount = 0;
      (cacheableUpsert as Mock).mockImplementation(() => {
        upsertCallCount += 1;
        return Promise.resolve({ id: upsertCallCount });
      });

      (eventToDateTimeParts as Mock).mockReturnValue({
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });

      pruneMock.mockImplementation(() => executeMock);
      executeMock.execute.mockResolvedValue([]);
    });

    it('should replace all event sets and call all repositories', async () => {
      (OnHoldEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });
      (ProcessEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });

      const result = await replaceRecordService(record);

      expect(result).toEqual([]);
      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(TransactionRepository).toHaveBeenCalledTimes(1);
      expect(baseRepositoryMock.create).toHaveBeenCalledWith({ id: record.transaction_id });
      expect(executeMock.execute).toHaveBeenCalled();
      expect(cacheableUpsert).toHaveBeenNthCalledWith(1, new SystemRepository(), {
        id: record.system_id
      });
      expect(cacheableUpsert).toHaveBeenNthCalledWith(2, new VersionRepository(), { id: record.version });
      expect(cacheableUpsert).toHaveBeenNthCalledWith(3, new RecordKindRepository(), {
        kind: record.kind,
        versionId: record.version
      });
      expect(cacheableUpsert).toHaveBeenNthCalledWith(
        4,
        new SystemRecordRepository(),
        {
          recordId: record.record_id,
          recordKindId: 3,
          systemId: record.system_id
        },
        false
      );
      expect(cacheableUpsert).toHaveBeenNthCalledWith(5, new CodingRepository(), {
        code: record.process_event_set[0].process.code,
        codeSystem: record.process_event_set[0].process.code_system,
        versionId: record.version
      });

      expect(ProcessEventRepository).toHaveBeenCalledTimes(2);
      expect(ProcessEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(pruneMock).toHaveBeenCalledTimes(2);
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(2, {
        codingId: 5,
        systemRecordId: 4,
        transactionId: record.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(3, {
        codingId: 6,
        status: 'active',
        statusCode: 'A',
        statusDescription: 'Active',
        systemRecordId: 4,
        transactionId: record.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
    });

    it('should handle multiple process events', async () => {
      const multiEventSet: Record = {
        ...record,
        process_event_set: [
          ...record.process_event_set,
          {
            event: { start_datetime: '2024-01-02T00:00:00Z', end_datetime: '2024-01-02T01:00:00Z' },
            process: {
              code: '123',
              code_display: 'Test Display',
              code_set: ['123'],
              code_system: 'SOMECODESYSTEM',
              status: 'inactive',
              status_code: 'I',
              status_description: 'Inactive'
            }
          }
        ]
      };

      (OnHoldEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });
      (ProcessEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });

      const result = await replaceRecordService(multiEventSet);

      expect(result).toEqual([]);
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(2, {
        codingId: 5,
        systemRecordId: 4,
        transactionId: record.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(3, {
        codingId: 6,
        status: 'active',
        statusCode: 'A',
        statusDescription: 'Active',
        systemRecordId: 4,
        transactionId: record.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(4, {
        codingId: 7,
        status: 'inactive',
        statusCode: 'I',
        statusDescription: 'Inactive',
        systemRecordId: 4,
        transactionId: record.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
    });
  });
});
