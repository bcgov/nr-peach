import { v7 as uuidv7 } from 'uuid';

import {
  cacheableRead,
  cacheableUpsert,
  dateTimePartsToEvent,
  eventToDateTimeParts,
  findWhereOrUpsert,
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
import { CodingDictionary, containsSubset, getLogger, Problem } from '../utils/index.ts';

import type { DeleteResult, Selectable } from 'kysely';
import type { Coding, CodingEvent, Header, PiesSystemRecord, Process, ProcessEvent, Record } from '../types/index.d.ts';

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
          log.warn(`No record kind found, ${error}`);
          throw new Problem(404, { detail: 'No record kind found.' });
        }
      );

      const processEventsRaw = await new ProcessEventRepository(trx)
        .findWhere({ systemRecordId: systemRecord.id })
        .execute();

      const onHoldEventsRaw = await new OnHoldEventRepository(trx)
        .findWhere({ systemRecordId: systemRecord.id })
        .execute();

      let onHoldEvents: CodingEvent[] | undefined;
      if (onHoldEventsRaw.length) {
        onHoldEvents = await Promise.all(
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
      }

      let processEvents: ProcessEvent[] | undefined;
      if (processEventsRaw.length) {
        processEvents = await Promise.all(
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
      }

      return {
        transaction_id: uuidv7(),
        version: recordKind.versionId,
        kind: 'Record',
        system_id: systemRecord.systemId,
        record_id: systemRecord.recordId,
        record_kind: recordKind.kind as Header['record_kind'],
        on_hold_event_set: onHoldEvents,
        process_event_set: processEvents
      } satisfies Record;
    },
    { accessMode: 'read only' }
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeRecordService = (data: Record, principal?: string): Promise<void> => {
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
 * @param principal - The authenticated identity performing the operation.
 * @returns A promise that resolves when the operation is complete.
 */
export const replaceRecordService = (data: Record, principal?: string): Promise<void> => {
  return transactionWrapper(async (trx) => {
    // Update atomic fact tables
    await Promise.all([
      new TransactionRepository(trx).create({ id: data.transaction_id, createdBy: principal }).execute(),
      cacheableUpsert(new SystemRepository(trx), { id: data.system_id }),
      cacheableUpsert(new VersionRepository(trx), { id: data.version })
    ]);

    const recordKind = await cacheableUpsert(new RecordKindRepository(trx), {
      kind: data.record_kind,
      versionId: data.version
    });
    const systemRecord = await findWhereOrUpsert(new SystemRecordRepository(trx), {
      recordId: data.record_id,
      recordKindId: recordKind.id,
      systemId: data.system_id
    });

    // Calculate on hold events
    const oheOld = (await new OnHoldEventRepository(trx).findWhere({ systemRecordId: systemRecord.id }).execute()).map(
      (ohe) => ({
        id: ohe.id,
        codingId: ohe.codingId,
        ...dateTimePartsToEvent({
          startDate: ohe.startDate,
          startTime: ohe.startTime ?? undefined,
          endDate: ohe.endDate ?? undefined,
          endTime: ohe.endTime ?? undefined
        })
      })
    );

    // Map to a union type of number | object
    const oheResults = await Promise.all(
      data.on_hold_event_set?.map(async (ce) => {
        const { id: codingId } = await cacheableUpsert(new CodingRepository(trx), {
          code: ce.coding.code,
          codeSystem: ce.coding.code_system,
          versionId: data.version
        });

        const ceNew = { codingId, ...ce.event };
        const oheMatched = oheOld.find((ceOld) => containsSubset(ceOld, ceNew));

        if (oheMatched) return oheMatched.id;
        return {
          codingId,
          systemRecordId: systemRecord.id,
          transactionId: data.transaction_id,
          ...eventToDateTimeParts(ce.event),
          createdBy: principal
        };
      }) ?? []
    );

    const oheMatchedIds = oheResults.filter((r) => typeof r === 'number');
    const oheAdd = oheResults.filter((r) => typeof r !== 'number');

    // Calculate process events
    const peOld = (await new ProcessEventRepository(trx).findWhere({ systemRecordId: systemRecord.id }).execute()).map(
      (pe) => ({
        id: pe.id,
        codingId: pe.codingId,
        status: pe.status,
        statusCode: pe.statusCode,
        statusDescription: pe.statusDescription,
        ...dateTimePartsToEvent({
          startDate: pe.startDate,
          startTime: pe.startTime ?? undefined,
          endDate: pe.endDate ?? undefined,
          endTime: pe.endTime ?? undefined
        })
      })
    );

    // Map to a union type: number (matched ID) | object (new record)
    const peResults = await Promise.all(
      data.process_event_set?.map(async (pe) => {
        const { id: codingId } = await cacheableUpsert(new CodingRepository(trx), {
          code: pe.process.code,
          codeSystem: pe.process.code_system,
          versionId: data.version
        });

        const peNew = {
          codingId,
          status: pe.process.status,
          statusCode: pe.process.status_code,
          statusDescription: pe.process.status_description,
          ...pe.event
        };
        const matched = peOld.find((old) => containsSubset(old, peNew));

        if (matched) return matched.id;
        return {
          codingId,
          status: pe.process.status,
          statusCode: pe.process.status_code,
          statusDescription: pe.process.status_description,
          systemRecordId: systemRecord.id,
          transactionId: data.transaction_id,
          ...eventToDateTimeParts(pe.event),
          createdBy: principal
        };
      }) ?? []
    );

    const peMatchedIds = peResults.filter((r) => typeof r === 'number');
    const peAdd = peResults.filter((r) => typeof r !== 'number');

    // Update event tables
    await Promise.all([
      oheMatchedIds.length < oheOld.length &&
        new OnHoldEventRepository(trx).deleteExcept(oheMatchedIds, { systemRecordId: systemRecord.id }).execute(),
      peMatchedIds.length < peOld.length &&
        new ProcessEventRepository(trx).deleteExcept(peMatchedIds, { systemRecordId: systemRecord.id }).execute()
    ]);
    await Promise.all([
      oheAdd.length && new OnHoldEventRepository(trx).createMany(oheAdd).execute(),
      peAdd.length && new ProcessEventRepository(trx).createMany(peAdd).execute()
    ]);
  });
};
