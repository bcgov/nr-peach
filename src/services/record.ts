import { v7 as uuidv7 } from 'uuid';

import {
  cacheableRead,
  cacheableUpsert,
  dateTimePartsToEvent,
  eventToDateTimeParts,
  transactionWrapper
} from './helpers/index.ts';
import {
  CodingRepository,
  OnHoldEventRepository,
  ProcessEventRepository,
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../repositories/index.ts';
import { CodingDictionary, getLogger, Problem } from '../utils/index.ts';

import type { DeleteResult, Selectable } from 'kysely';
import type {
  Coding,
  CodingEvent,
  Header,
  PiesProcessEvent,
  PiesSystemRecord,
  Process,
  ProcessEvent,
  Record
} from '../types/index.d.ts';

const log = getLogger(import.meta.filename);

/**
 * Retrieves the record for the given system record.
 * @param systemRecord - The system record for which to retrieve the record.
 * @returns A Promise that resolves to the record for the given system record.
 * @throws {Problem} 404 if no process events are found.
 */
export const findRecordService = (systemRecord: Selectable<PiesSystemRecord>): Promise<Record> => {
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

      const onHoldEventsRaw = await new OnHoldEventRepository(trx)
        .findBy({ systemRecordId: systemRecord.id })
        .execute();

      const onHoldEvents: CodingEvent[] = await Promise.all(
        onHoldEventsRaw.map(async (pe) => {
          const event = dateTimePartsToEvent({
            startDate: pe.startDate,
            startTime: pe.startTime ?? undefined,
            endDate: pe.endDate ?? undefined,
            endTime: pe.endTime ?? undefined
          });

          const codingRaw = await cacheableRead(new CodingRepository(trx), pe.codingId).catch((error) => {
            log.warn(`No coding found for on hold events, ${error}`);
            throw new Problem(404, { detail: 'No valid on hold codings found.' });
          });

          const coding: Coding = {
            code: codingRaw.code,
            code_display: CodingDictionary[codingRaw.codeSystem][codingRaw.code].display,
            code_set: CodingDictionary[codingRaw.codeSystem][codingRaw.code].codeSet,
            code_system: codingRaw.codeSystem
          };
          return { coding, event } satisfies CodingEvent;
        })
      );

      const processEvents: ProcessEvent[] = await Promise.all(
        processEventsRaw.map(async (pe) => {
          const event = dateTimePartsToEvent({
            startDate: pe.startDate,
            startTime: pe.startTime ?? undefined,
            endDate: pe.endDate ?? undefined,
            endTime: pe.endTime ?? undefined
          });

          const coding = await cacheableRead(new CodingRepository(trx), pe.codingId).catch((error) => {
            log.warn(`No coding found for process events, ${error}`);
            throw new Problem(404, { detail: 'No valid process codings found.' });
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
          return { event, process } satisfies ProcessEvent;
        })
      );

      return {
        transaction_id: uuidv7(),
        version: recordKind.versionId,
        kind: 'Record',
        system_id: systemRecord.systemId,
        record_id: systemRecord.recordId,
        record_kind: recordKind.kind as Header['record_kind'],
        on_hold_event_set: onHoldEvents,
        process_event_set: processEvents as [ProcessEvent, ...ProcessEvent[]]
      } satisfies Record;
    },
    { accessMode: 'read only' }
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeRecordService = (data: Record): Promise<void> => {
  throw new Error('mergeRecordService not implemented');
};

/**
 * Prunes the record for the given system record.
 * @param systemRecord - The system record to prune.
 * @returns A Promise that resolves when the operation is complete.
 */
export const pruneRecordService = async (
  systemRecord: Selectable<PiesSystemRecord>
): Promise<readonly DeleteResult[][]> => {
  return transactionWrapper(async (trx) => {
    return await Promise.all([
      new OnHoldEventRepository(trx).prune(systemRecord.id).execute(),
      new ProcessEventRepository(trx).prune(systemRecord.id).execute()
    ]);
  });
};

/**
 * Replaces the record for the given system record.
 * @param data - The record to replace.
 * @returns A promise that resolves when the operation is complete.
 */
export const replaceRecordService = (data: Record): Promise<readonly Selectable<PiesProcessEvent>[]> => {
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
    const systemRecord = await cacheableUpsert(
      new SystemRecordRepository(trx),
      {
        recordId: data.record_id,
        recordKindId: recordKind.id,
        systemId: data.system_id
      },
      false // LRU caching is not very beneficial for this operation
    );

    // Prune existing on hold and process events for the system record
    await Promise.all([
      new OnHoldEventRepository(trx).prune(systemRecord.id).execute(),
      new ProcessEventRepository(trx).prune(systemRecord.id).execute()
    ]);

    // Insert new on hold events
    await Promise.all(
      data.on_hold_event_set.map(async (ce) => {
        const coding = await cacheableUpsert(new CodingRepository(trx), {
          code: ce.coding.code,
          codeSystem: ce.coding.code_system,
          versionId: data.version
        });

        return await new OnHoldEventRepository(trx)
          .create({
            codingId: coding.id,
            systemRecordId: systemRecord.id,
            transactionId: data.transaction_id,
            ...eventToDateTimeParts(ce.event)
          })
          .execute();
      })
    ).then((ohes) => ohes.flatMap((pe) => pe));

    // Insert new process events
    return await Promise.all(
      data.process_event_set.map(async (pe) => {
        const coding = await cacheableUpsert(new CodingRepository(trx), {
          code: pe.process.code,
          codeSystem: pe.process.code_system,
          versionId: data.version
        });

        return await new ProcessEventRepository(trx)
          .create({
            codingId: coding.id,
            status: pe.process.status,
            statusCode: pe.process.status_code,
            statusDescription: pe.process.status_description,
            systemRecordId: systemRecord.id,
            transactionId: data.transaction_id,
            ...eventToDateTimeParts(pe.event)
          })
          .execute();
      })
    ).then((pes) => pes.flatMap((pe) => pe));
  });
};
