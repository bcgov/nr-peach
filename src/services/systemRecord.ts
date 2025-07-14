import { transactionWrapper } from './helpers/index.ts';
import { SystemRecordRepository } from '../repositories/index.ts';
import { Problem } from '../utils/index.ts';

import type { Selectable } from 'kysely';
import type { PiesSystemRecord } from '../types/index.d.ts';

/**
 * Finds a single system record by its record ID and optionally by system ID.
 * @param recordId - The unique identifier of the record to find.
 * @param systemId - (Optional) The system ID to further filter the search.
 * @returns A promise that resolves to the found system record.
 * @throws {Problem} If no record is found (404) or if multiple records are found without a `systemId` (409).
 */
export const findSingleSystemRecordService = async (
  recordId: string,
  systemId?: string
): Promise<Selectable<PiesSystemRecord>> => {
  return transactionWrapper(
    async (trx) => {
      const systemRecords = await new SystemRecordRepository(trx).findBy({ recordId, systemId }).execute();

      if (!systemRecords.length) {
        const params: Record<string, string> = { record_id: recordId };
        if (systemId) params.system_id = systemId;
        throw new Problem(404, { detail: 'System record not found' }, params);
      }
      if (systemRecords.length > 1) {
        throw new Problem(
          409,
          { detail: 'Cannot disambiguate intended system record without `system_id`' },
          { record_id: recordId }
        );
      }

      return systemRecords[0];
    },
    { accessMode: 'read only' }
  );
};
