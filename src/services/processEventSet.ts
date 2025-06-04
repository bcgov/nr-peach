import { transactionWrapper } from '../db/index.ts';
import {
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../repositories/index.ts';

import { readableUpsert } from './utils.ts';

import type { ProcessEventSet } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeProcessEventSetService = (id: string, data: ProcessEventSet): Promise<void> => {
  throw new Error('mergeProcessEventSetService not implemented');
};

export const replaceProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  return transactionWrapper(async (trx) => {
    await new SystemRepository(trx).upsert({ id: data.system_id }).execute();
    await new TransactionRepository(trx).upsert({ id: data.transaction_id }).execute();

    const version = await readableUpsert(new VersionRepository(trx), { id: data.version }, data.version);
    const recordKind = await readableUpsert(
      new RecordKindRepository(trx),
      { kind: data.kind, versionId: version.id },
      data.kind
    );

    await new SystemRecordRepository(trx)
      .upsert({
        systemId: data.system_id,
        recordId: data.record_id,
        recordKindId: recordKind.id
      })
      .execute();
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
