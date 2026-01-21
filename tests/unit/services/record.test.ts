// Always import repository.helper.ts and helpers/index.ts first to ensure mocks are set up
import { executeMock } from './repository.helper.ts';
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
        detail: 'No record kind found.'
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
    const recordData: Record = {
      transaction_id: 'txn-1',
      version: 'v1',
      kind: 'Record',
      system_id: 'sys-1',
      record_id: 'rec-1',
      record_kind: 'Permit',
      on_hold_event_set: [
        {
          coding: {
            code: 'ON_HOLD',
            code_set: ['ON_HOLD'],
            code_system: 'https://example.com/codesystem/on_hold'
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
            code: 'PROCESS_CODE',
            code_set: ['PROCESS_CODE'],
            code_system: 'https://example.com/codesystem/process',
            status: 'active',
            status_code: 'A',
            status_description: 'Active'
          }
        }
      ]
    };

    beforeEach(() => {
      executeMock.execute.mockResolvedValue([]);
      (cacheableUpsert as Mock).mockResolvedValue({ id: 1 });
      (dateTimePartsToEvent as Mock).mockReturnValue({
        start_datetime: '2024-01-01T00:00:00Z',
        end_datetime: '2024-01-01T01:00:00Z'
      });
      (eventToDateTimeParts as Mock).mockReturnValue({
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
    });

    it('should replace the record successfully', async () => {
      const createMock = vi.fn().mockImplementation(() => executeMock);
      const findByMock = vi.fn().mockImplementation(() => executeMock);
      const createManyMock = vi.fn().mockImplementation(() => executeMock);
      const deleteManyMock = vi.fn().mockImplementation(() => executeMock);

      (TransactionRepository as Mock).mockImplementation(function () {
        return { create: createMock };
      });
      (SystemRepository as Mock).mockImplementation(function () {
        return { upsert: cacheableUpsert };
      });
      (VersionRepository as Mock).mockImplementation(function () {
        return { upsert: cacheableUpsert };
      });
      (RecordKindRepository as Mock).mockImplementation(function () {
        return { upsert: cacheableUpsert };
      });
      (SystemRecordRepository as Mock).mockImplementation(function () {
        return { upsert: cacheableUpsert };
      });
      (OnHoldEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock,
          deleteMany: deleteManyMock
        };
      });
      (ProcessEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock,
          deleteMany: deleteManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(cacheableUpsert).toHaveBeenCalledTimes(6);
      expect(createMock).toHaveBeenCalledWith({ id: recordData.transaction_id });
      expect(findByMock).toHaveBeenCalledTimes(2);
      expect(createManyMock).toHaveBeenCalledTimes(2);
      expect(deleteManyMock).toHaveBeenCalledTimes(0);
    });

    it('should handle adding new on hold events', async () => {
      const findByMock = vi.fn().mockImplementation(() => executeMock);
      const createManyMock = vi.fn().mockImplementation(() => executeMock);

      (OnHoldEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(findByMock).toHaveBeenCalledWith({ systemRecordId: 1 });
      expect(createManyMock).toHaveBeenCalledWith([
        {
          codingId: 1,
          systemRecordId: 1,
          transactionId: recordData.transaction_id,
          startDate: '2024-01-01',
          startTime: '00:00:00',
          endDate: '2024-01-01',
          endTime: '01:00:00'
        }
      ]);
    });

    it('should handle deleting unmatched on hold events', async () => {
      const findByMock = vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue([
          {
            id: 2,
            codingId: 2,
            startDate: '2024-01-01',
            startTime: '00:00:00',
            endDate: '2024-01-01',
            endTime: '01:00:00'
          }
        ])
      }));
      const createManyMock = vi.fn().mockImplementation(() => executeMock);
      const deleteManyMock = vi.fn().mockImplementation(() => executeMock);

      (OnHoldEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock,
          deleteMany: deleteManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(findByMock).toHaveBeenCalledWith({ systemRecordId: 1 });
      expect(deleteManyMock).toHaveBeenCalledWith([2]);
    });

    it('should skip over matched on hold events', async () => {
      const findByMock = vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue([
          {
            id: 1,
            codingId: 1,
            startDate: '2024-01-01',
            startTime: '00:00:00',
            endDate: '2024-01-01',
            endTime: '01:00:00'
          }
        ])
      }));
      const createManyMock = vi.fn().mockImplementation(() => executeMock);
      const deleteManyMock = vi.fn().mockImplementation(() => executeMock);

      (OnHoldEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock,
          deleteMany: deleteManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(findByMock).toHaveBeenCalledWith({ systemRecordId: 1 });
      expect(deleteManyMock).toHaveBeenCalledTimes(0);
    });

    it('should handle adding new process events', async () => {
      const findByMock = vi.fn().mockImplementation(() => executeMock);
      const createManyMock = vi.fn().mockImplementation(() => executeMock);

      (ProcessEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(findByMock).toHaveBeenCalledWith({ systemRecordId: 1 });
      expect(createManyMock).toHaveBeenCalledWith([
        {
          codingId: 1,
          status: 'active',
          statusCode: 'A',
          statusDescription: 'Active',
          systemRecordId: 1,
          transactionId: recordData.transaction_id,
          startDate: '2024-01-01',
          startTime: '00:00:00',
          endDate: '2024-01-01',
          endTime: '01:00:00'
        }
      ]);
    });

    it('should handle deleting unmatched process events', async () => {
      const findByMock = vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue([
          {
            id: 2,
            codingId: 2,
            status: 'inactive',
            statusCode: 'I',
            statusDescription: 'Inactive',
            startDate: '2024-01-01',
            startTime: '00:00:00',
            endDate: '2024-01-01',
            endTime: '01:00:00'
          }
        ])
      }));
      const createManyMock = vi.fn().mockImplementation(() => executeMock);
      const deleteManyMock = vi.fn().mockImplementation(() => executeMock);

      (ProcessEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock,
          deleteMany: deleteManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(findByMock).toHaveBeenCalledWith({ systemRecordId: 1 });
      expect(deleteManyMock).toHaveBeenCalledWith([2]);
    });

    it('should skip over matched process events', async () => {
      const findByMock = vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue([
          {
            id: 1,
            codingId: 1,
            status: 'active',
            statusCode: 'A',
            statusDescription: 'Active',
            startDate: '2024-01-01',
            startTime: '00:00:00',
            endDate: '2024-01-01',
            endTime: '01:00:00'
          }
        ])
      }));
      const createManyMock = vi.fn().mockImplementation(() => executeMock);
      const deleteManyMock = vi.fn().mockImplementation(() => executeMock);

      (ProcessEventRepository as Mock).mockImplementation(function () {
        return {
          findBy: findByMock,
          createMany: createManyMock,
          deleteMany: deleteManyMock
        };
      });

      await replaceRecordService(recordData);

      expect(findByMock).toHaveBeenCalledWith({ systemRecordId: 1 });
      expect(deleteManyMock).toHaveBeenCalledTimes(0);
    });
  });
});
