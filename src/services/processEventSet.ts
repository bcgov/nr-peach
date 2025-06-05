import { transactionWrapper } from '../db/index.ts';
import {
  CodingRepository,
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../repositories/index.ts';

import { returnableUpsert } from './utils.ts';

import type { ProcessEventSet } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeProcessEventSetService = (id: string, data: ProcessEventSet): Promise<void> => {
  throw new Error('mergeProcessEventSetService not implemented');
};

export const replaceProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  return transactionWrapper(async (trx) => {
    await new SystemRepository(trx).upsert({ id: data.system_id }).execute();
    await new TransactionRepository(trx).upsert({ id: data.transaction_id }).execute();

    const version = await returnableUpsert(new VersionRepository(trx), { id: data.version });
    const recordKind = await returnableUpsert(new RecordKindRepository(trx), {
      kind: data.kind,
      versionId: version.id
    });
    await returnableUpsert(new SystemRecordRepository(trx), {
      recordId: data.record_id,
      recordKindId: recordKind.id,
      systemId: data.system_id
    });
    await Promise.all(
      data.process_event.map(async (pe) => {
        await returnableUpsert(new CodingRepository(trx), {
          code: pe.process.code,
          codeSystem: pe.process.code_system,
          versionId: version.id
        });
      })
    );
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
