import { transactionWrapper } from './utils.ts';
import { SystemRecordRepository } from '../repositories/index.ts';
import { Problem } from '../utils/index.ts';

import type { Selectable } from 'kysely';
import type { PiesSystemRecord } from '../types/index.d.ts';

/**
 * Assert that exactly one system record exists for the given record ID.
 * @param recordId - Record ID of the system record to check.
 * @returns The single matching system record.
 * @throws {Problem} 404 if no system record is found, 409 if multiple systems records are found.
 */
export const assertSingleSystemRecordService = async (recordId: string): Promise<Selectable<PiesSystemRecord>> => {
  return transactionWrapper(
    async (trx) => {
      const systemRecords = await new SystemRecordRepository(trx).findBy({ recordId }).execute();

      if (!systemRecords.length) {
        throw new Problem(404, { detail: 'System record not found' }, { record_id: recordId });
      }

      if (systemRecords.length > 1) {
        throw new Problem(
          409,
          { detail: 'Cannot resolve intended system record without `system_id`.' },
          { record_id: recordId }
        );
      }

      return systemRecords[0];
    },
    { accessMode: 'read only' }
  );
};

/**
 * Retrieves a single system, if only record ID is provided assert that only a single system record exists.
 * @param recordId - Record ID used to find the system record.
 * @param [systemId] - Optional system ID used to find the system record.
 * @returns The system record.
 */
export const findSingleSystemRecordService = async (
  recordId: string,
  systemId?: string
): Promise<Selectable<PiesSystemRecord>> => {
  return transactionWrapper(
    async (trx) => {
      if (systemId) {
        return new SystemRecordRepository(trx).findBy({ recordId, systemId }).executeTakeFirstOrThrow();
      }

      return assertSingleSystemRecordService(recordId);
    },
    { accessMode: 'read only' }
  );
};
