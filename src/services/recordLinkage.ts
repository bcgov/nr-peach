import { DatabaseError } from 'pg';
import { v7 as uuidv7 } from 'uuid';

import { cacheableRead, cacheableUpsert, findByThenUpsert, transactionWrapper } from './helpers/index.ts';
import {
  RecordKindRepository,
  RecordLinkageRepository,
  SystemRecordRepository,
  SystemRepository,
  TransactionRepository
} from '../repositories/index.ts';

import type { DeleteResult, Selectable } from 'kysely';
import type { Header, PiesSystemRecord, RecordLinkage } from '../types/index.d.ts';

/**
 * Adds the record linkage for the given system record, if system record doesn't exist create.
 * @param data - The record linkage to add.
 * @returns A Promise that resolves when the operation is complete.
 */
export const addRecordLinkageService = async (data: RecordLinkage): Promise<void> => {
  await transactionWrapper(async (trx) => {
    await new TransactionRepository(trx).create({ id: data.transaction_id }).execute();
    let systemRecord = await new SystemRecordRepository(trx)
      .findBy({ systemId: data.system_id, recordId: data.record_id })
      .executeTakeFirst();

    if (!systemRecord) {
      await cacheableUpsert(new SystemRepository(trx), { id: data.system_id });
      const recordKind = await cacheableUpsert(new RecordKindRepository(trx), {
        kind: data.record_kind,
        versionId: data.version
      });
      systemRecord = await findByThenUpsert(new SystemRecordRepository(trx), {
        recordId: data.record_id,
        recordKindId: recordKind.id,
        systemId: data.system_id
      });
    }

    let linkedSystemRecord = await new SystemRecordRepository(trx)
      .findBy({ systemId: data.linked_system_id, recordId: data.linked_record_id })
      .executeTakeFirst();

    if (!linkedSystemRecord) {
      await cacheableUpsert(new SystemRepository(trx), { id: data.linked_system_id });
      const linkedRecordKind = await cacheableUpsert(new RecordKindRepository(trx), {
        kind: data.linked_record_kind,
        versionId: data.version
      });
      linkedSystemRecord = await findByThenUpsert(new SystemRecordRepository(trx), {
        recordId: data.linked_record_id,
        recordKindId: linkedRecordKind.id,
        systemId: data.linked_system_id
      });
    }

    await new RecordLinkageRepository(trx)
      .create({
        transactionId: data.transaction_id,
        systemRecordId: systemRecord.id,
        linkedSystemRecordId: linkedSystemRecord.id
      })
      .execute()
      .catch((error) => {
        if (
          error instanceof DatabaseError &&
          error.code === '23505' &&
          error.constraint === 'record_linkage_undirected'
        ) {
          return; // Undirected entry already exists
        }
      });
  });
};

/**
 * Deletes the record linkage between the given system record and linked system record.
 * @param systemRecord - The system record to delete.
 * @param linkedSystemRecord - The system record to delete.
 * @returns A Promise that resolves when the operation is complete.
 */
export const deleteRecordLinkageService = async (
  systemRecord: Selectable<PiesSystemRecord>,
  linkedSystemRecord: Selectable<PiesSystemRecord>
): Promise<readonly DeleteResult[]> => {
  return transactionWrapper(async (trx) => {
    return new RecordLinkageRepository(trx).drop([systemRecord.id, linkedSystemRecord.id]).execute();
  });
};

/**
 * Retrieves the record linkages for the given system record.
 * @param systemRecord - The system record for which to retrieve linked records.
 * @returns A Promise that resolves to a list of record linkages for the given system record.
 */
export const findRecordLinkagesService = (systemRecord: Selectable<PiesSystemRecord>): Promise<RecordLinkage[]> => {
  return transactionWrapper(
    async (trx) => {
      const recordLinkages = await new RecordLinkageRepository(trx).list(systemRecord.id).execute();
      if (!recordLinkages.length) return [];

      return await Promise.all(
        recordLinkages.map(async (rl) => {
          const systemRecord = await new SystemRecordRepository(trx).read(rl.systemRecordId).executeTakeFirstOrThrow();
          const linkedSystemRecord = await new SystemRecordRepository(trx)
            .read(rl.linkedSystemRecordId)
            .executeTakeFirstOrThrow();
          const recordKind = await cacheableRead(new RecordKindRepository(trx), systemRecord.recordKindId);
          const linkedRecordKind = await cacheableRead(new RecordKindRepository(trx), linkedSystemRecord.recordKindId);

          return {
            transaction_id: uuidv7(),
            version: recordKind.versionId,
            kind: 'RecordLinkage',
            system_id: systemRecord.systemId,
            record_id: systemRecord.recordId,
            record_kind: recordKind.kind as Header['record_kind'],
            linked_system_id: linkedSystemRecord.systemId,
            linked_record_id: linkedSystemRecord.recordId,
            linked_record_kind: linkedRecordKind.kind as Header['record_kind']
          } satisfies RecordLinkage;
        })
      );
    },
    { accessMode: 'read only' }
  );
};
