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
  ProcessEventRepository,
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../../../src/repositories/index.ts';
import {
  findProcessEventSetService,
  deleteProcessEventSetService,
  replaceProcessEventSetService
} from '../../../src/services/processEventSet.ts';

import type { Selectable } from 'kysely';
import type { Mock } from 'vitest';
import type { PiesSystemRecord, ProcessEventSet } from '../../../src/types/index.d.ts';

describe('processEventSetService', () => {
  const systemRecord = {
    id: 1,
    recordKindId: 2,
    systemId: 'sys-1',
    recordId: 'rec-1'
  } as Selectable<PiesSystemRecord>;

  describe('findProcessEventSetService', () => {
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

    it('should return a ProcessEventSet when events are found', async () => {
      executeMock.execute.mockResolvedValue(processEventsRaw);

      const result = await findProcessEventSetService(systemRecord);

      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(cacheableRead).toHaveBeenNthCalledWith(1, new RecordKindRepository(), systemRecord.recordKindId);
      expect(cacheableRead).toHaveBeenNthCalledWith(2, new CodingRepository(), processEventsRaw[0].codingId);
      expect(ProcessEventRepository).toHaveBeenCalledTimes(1);
      expect(ProcessEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(result).toMatchObject({
        kind: 'ProcessEventSet',
        system_id: systemRecord.systemId,
        record_id: systemRecord.recordId,
        record_kind: 'Permit',
        version: 'v1',
        process_event: [
          {
            event: {
              start_datetime: '2024-01-01T00:00:00Z',
              end_datetime: '2024-01-01T01:00:00Z'
            },
            process: {
              code: 'APPLICATION',
              code_display: 'Application',
              code_set: ['APPLICATION'],
              code_system: 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process',
              status: 'active',
              status_code: 'A',
              status_description: 'Active'
            }
          }
        ]
      });
    });

    it('should throw Problem 404 if no record kind found', async () => {
      (cacheableRead as Mock).mockRejectedValueOnce(new Error('not found'));
      await expect(findProcessEventSetService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No process events found.'
      });
    });

    it('should throw Problem 404 if no process events found', async () => {
      await expect(findProcessEventSetService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No process events found.'
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
          return Promise.reject(new Error('not found'));
        });

      await expect(() => findProcessEventSetService(systemRecord)).rejects.toMatchObject({
        status: 404,
        detail: 'No process events found.'
      });
    });
  });

  describe('deleteProcessEventSetService', () => {
    it('should call prune on ProcessEventRepository', async () => {
      executeMock.execute.mockResolvedValue([]);
      const pruneMock = vi.fn().mockImplementation(() => executeMock);
      (ProcessEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });

      const result = await deleteProcessEventSetService(systemRecord);

      expect(result).toEqual([]);
      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(ProcessEventRepository).toHaveBeenCalledTimes(1);
      expect(ProcessEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(pruneMock).toHaveBeenCalledWith(systemRecord.id);
      expect(executeMock.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('replaceProcessEventSetService', () => {
    const processEventSet: ProcessEventSet = {
      transaction_id: 'uuid-mock',
      version: 'v1',
      kind: 'ProcessEventSet',
      system_id: 'sys-1',
      record_id: 'rec-1',
      record_kind: 'Permit',
      process_event: [
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

    it('should replace process event set and call all repositories', async () => {
      (ProcessEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });

      const result = await replaceProcessEventSetService(processEventSet);

      expect(result).toEqual([]);
      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(TransactionRepository).toHaveBeenCalledTimes(1);
      expect(baseRepositoryMock.create).toHaveBeenCalledWith({ id: processEventSet.transaction_id });
      expect(executeMock.execute).toHaveBeenCalled();
      expect(cacheableUpsert).toHaveBeenNthCalledWith(1, new SystemRepository(), {
        id: processEventSet.system_id
      });
      expect(cacheableUpsert).toHaveBeenNthCalledWith(2, new VersionRepository(), { id: processEventSet.version });
      expect(cacheableUpsert).toHaveBeenNthCalledWith(3, new RecordKindRepository(), {
        kind: processEventSet.kind,
        versionId: processEventSet.version
      });
      expect(cacheableUpsert).toHaveBeenNthCalledWith(
        4,
        new SystemRecordRepository(),
        {
          recordId: processEventSet.record_id,
          recordKindId: 3,
          systemId: processEventSet.system_id
        },
        false
      );
      expect(cacheableUpsert).toHaveBeenNthCalledWith(5, new CodingRepository(), {
        code: processEventSet.process_event[0].process.code,
        codeSystem: processEventSet.process_event[0].process.code_system,
        versionId: processEventSet.version
      });

      expect(ProcessEventRepository).toHaveBeenCalledTimes(2);
      expect(ProcessEventRepository).toHaveBeenCalledWith(expect.anything());
      expect(pruneMock).toHaveBeenCalledTimes(1);
      expect(baseRepositoryMock.create).toHaveBeenCalledWith({
        codingId: 5,
        status: 'active',
        statusCode: 'A',
        statusDescription: 'Active',
        systemRecordId: 4,
        transactionId: processEventSet.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
    });

    it('should handle multiple process events', async () => {
      const multiEventSet: ProcessEventSet = {
        ...processEventSet,
        process_event: [
          ...processEventSet.process_event,
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

      (ProcessEventRepository as Mock).mockImplementationOnce(function () {
        return { prune: pruneMock };
      });

      const result = await replaceProcessEventSetService(multiEventSet);

      expect(result).toEqual([]);
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(2, {
        codingId: 5,
        status: 'active',
        statusCode: 'A',
        statusDescription: 'Active',
        systemRecordId: 4,
        transactionId: processEventSet.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
      expect(baseRepositoryMock.create).toHaveBeenNthCalledWith(3, {
        codingId: 6,
        status: 'inactive',
        statusCode: 'I',
        statusDescription: 'Inactive',
        systemRecordId: 4,
        transactionId: processEventSet.transaction_id,
        startDate: '2024-01-01',
        startTime: '00:00:00',
        endDate: '2024-01-01',
        endTime: '01:00:00'
      });
    });
  });
});
