import { transactionWrapper } from '../db/index.ts';
import {
  RecordKindRepository,
  SystemRepository,
  // SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../repositories/index.ts';

import type { ProcessEventSet } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeProcessEventSetService = (id: string, data: ProcessEventSet): Promise<void> => {
  throw new Error('mergeProcessEventSetService not implemented');
};

export const replaceProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  return transactionWrapper(async (trx) => {
    await new SystemRepository(trx).upsert({ id: data.system_id }).execute();
    await new TransactionRepository(trx).upsert({ id: data.transaction_id }).execute();
    let version = await new VersionRepository(trx).upsert({ id: data.version }).returningAll().execute();
    if (!version.length) {
      // TODO: Fix this type error
      // @ts-expect-error ts(2322)
      version = await new VersionRepository(trx).read(data.version).execute();
    }
    await new RecordKindRepository(trx).upsert({ kind: data.kind, versionId: version?.[0]?.id }).execute();
    // await new SystemRecordRepository(trx)
    //   .upsert({
    //     systemId: data.system_id,
    //     recordId: data.record_id,
    //     recordKindId: 0
    //   })
    //   .execute();
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const searchProcessEventSetService = (query: Record<string, unknown>): Promise<ProcessEventSet[]> => {
  throw new Error('searchProcessEventSetService not implemented');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteProcessEventSetService = (id: string): Promise<void> => {
  throw new Error('deleteProcessEventSetService not implemented');
};
