import { v7 as uuidv7 } from 'uuid';

import { CodingDictionary } from './coding.ts';
import { cacheableRead, cacheableUpsert } from './lruCache.ts';
import { transactionWrapper } from './utils.ts';
import {
  CodingRepository,
  ProcessEventRepository,
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../repositories/index.ts';
import { getLogger, Problem } from '../utils/index.ts';

import type { Selectable } from 'kysely';
import type { Event, Header, PiesSystemRecord, Process, ProcessEvent, ProcessEventSet } from '../types/index.d.ts';

const log = getLogger(import.meta.filename);

/**
 * Deletes the process event set for the given system record.
 * @param systemRecord - The system record for which to delete the process event set.
 */
export const deleteProcessEventSetService = async (systemRecord: Selectable<PiesSystemRecord>) => {
  await new ProcessEventRepository().prune(systemRecord.id).execute();
};

/**
 * Retrieves the process event set for the given system record.
 * @param systemRecord - The system record for which to retrieve the process event set.
 * @returns A Promise that resolves to the process event set for the given system record.
 * @throws {Problem} 404 if no process events are found.
 */
export const findProcessEventSetService = (systemRecord: Selectable<PiesSystemRecord>): Promise<ProcessEventSet> => {
  return transactionWrapper(
    async (trx) => {
      const recordKind = await cacheableRead(new RecordKindRepository(trx), systemRecord.recordKindId).catch(
        (error) => {
          log.warn(`No record kind found for process events, ${error}`);
          throw new Problem(404, { detail: 'No process events found.' });
        }
      );

      const processEventsRaw = await new ProcessEventRepository(trx)
        .findBy({ systemRecordId: systemRecord.id })
        .execute();

      if (!processEventsRaw.length) {
        log.warn('No coding found for process events');
        throw new Problem(404, { detail: 'No process events found.' });
      }

      const processEvents: ProcessEvent[] = await Promise.all(
        processEventsRaw.map(async (pe) => {
          // TODO: Should there be utility functions for ISO 8601 parsing?
          // TODO: Look into how safe validation is for date representation
          let event: Event;

          if (pe.startTime) {
            event = {
              start_datetime: `${pe.startDate.toISOString().split('T')[0]}T${pe.startTime}`,
              end_datetime:
                pe.endDate && pe.endTime ? `${pe.endDate.toISOString().split('T')[0]}T${pe.endTime}` : undefined
            };
          } else {
            event = {
              start_date: pe.startDate.toISOString().split('T')[0],
              end_date: pe.endDate ? pe.endDate.toISOString().split('T')[0] : undefined
            };
          }

          const coding = await cacheableRead(new CodingRepository(trx), pe.codingId).catch((error) => {
            log.warn(`No coding found for process events, ${error}`);
            throw new Problem(404, { detail: 'No process events found.' });
          });

          const process: Process = {
            code: coding.code,
            code_display: CodingDictionary[coding.codeSystem][coding.code].display,
            code_set: CodingDictionary[coding.codeSystem][coding.code].codeSet,
            code_system: coding.codeSystem,
            status: pe.status ?? undefined,
            status_code: pe.statusCode ?? undefined,
            status_description: pe.statusDescription ?? undefined
          };
          return { event, process };
        })
      );

      const processEventSet: ProcessEventSet = {
        transaction_id: uuidv7(),
        version: recordKind.versionId,
        kind: 'ProcessEventSet',
        system_id: systemRecord.systemId,
        record_id: systemRecord.recordId,
        record_kind: recordKind.kind as Header['record_kind'],
        process_event: processEvents as [ProcessEvent, ...ProcessEvent[]]
      };

      return processEventSet;
    },
    { accessMode: 'read only' }
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  throw new Error('mergeProcessEventSetService not implemented');
};

/**
 * Replaces the process event set for the given system record.
 * @param data - The process event set to replace.
 * @returns A promise that resolves when the operation is complete.
 */
export const replaceProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  return transactionWrapper(async (trx) => {
    // Update atomic fact tables
    await Promise.all([
      new TransactionRepository(trx).create({ id: data.transaction_id }).execute(),
      cacheableUpsert(new SystemRepository(trx), { id: data.system_id }),
      cacheableUpsert(new VersionRepository(trx), { id: data.version })
    ]);

    const recordKind = await cacheableUpsert(new RecordKindRepository(trx), {
      kind: data.kind,
      versionId: data.version
    });
    const systemRecord = await cacheableUpsert(new SystemRecordRepository(trx), {
      recordId: data.record_id,
      recordKindId: recordKind.id,
      systemId: data.system_id
    });

    // Prune existing process events for the system record
    await new ProcessEventRepository(trx).prune(systemRecord.id).execute();

    // Insert new process events
    await Promise.all(
      data.process_event.map(async (pe) => {
        const coding = await cacheableUpsert(new CodingRepository(trx), {
          code: pe.process.code,
          codeSystem: pe.process.code_system,
          versionId: data.version
        });

        // TODO: Should there be utility functions for ISO 8601 parsing?
        // TODO: Look into how safe validation is for date representation
        const eventStart = pe.event.start_datetime ?? pe.event.start_date!;
        const eventEnd = pe.event.end_datetime ?? pe.event.end_date;
        await new ProcessEventRepository(trx)
          .create({
            codingId: coding.id,
            endDate: eventEnd?.split('T')[0],
            endTime: pe.event.end_datetime ? eventEnd?.split('T')[1] : undefined,
            startDate: eventStart.split('T')[0],
            startTime: pe.event.start_datetime ? eventStart.split('T')[1] : undefined,
            status: pe.process.status,
            statusCode: pe.process.status_code,
            statusDescription: pe.process.status_description,
            systemRecordId: systemRecord.id,
            transactionId: data.transaction_id
          })
          .execute();
      })
    );
  });
};
