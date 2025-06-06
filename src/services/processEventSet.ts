import { transactionWrapper } from '../db/index.ts';
import {
  CodingRepository,
  ProcessEventRepository,
  RecordKindRepository,
  SystemRepository,
  SystemRecordRepository,
  TransactionRepository,
  VersionRepository
} from '../repositories/index.ts';
import { Problem } from '../utils/index.ts';

import { isValidCoding, returnableUpsert } from './index.ts';

import type { ProcessEventSet } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mergeProcessEventSetService = (id: string, data: ProcessEventSet): Promise<void> => {
  throw new Error('mergeProcessEventSetService not implemented');
};

export const replaceProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  return transactionWrapper(async (trx) => {
    await Promise.all([
      new SystemRepository(trx).upsert({ id: data.system_id }).execute(),
      new TransactionRepository(trx).upsert({ id: data.transaction_id }).execute(),
      new VersionRepository(trx).upsert({ id: data.version }).execute()
    ]);

    const recordKind = await returnableUpsert(new RecordKindRepository(trx), {
      kind: data.kind,
      versionId: data.version
    });
    const systemRecord = await returnableUpsert(new SystemRecordRepository(trx), {
      recordId: data.record_id,
      recordKindId: recordKind.id,
      systemId: data.system_id
    });
    await Promise.all(
      data.process_event.map(async (pe, index) => {
        if (!isValidCoding(pe.process.code_system, pe.process.code)) {
          throw new Problem(422, {
            detail: `Invalid Process element at index ${index}: '${pe.process.code}' - '${pe.process.code_system}'`
          });
        }

        const coding = await returnableUpsert(new CodingRepository(trx), {
          code: pe.process.code,
          codeSystem: pe.process.code_system,
          versionId: data.version
        });

        // TODO: Full logic for replace requires "pruning" and creating all of the process events.
        // TODO: Look into better ways of handling date validation and conversion.
        const startDate = pe.event.start_date ? new Date(pe.event.start_date) : undefined;
        if (!startDate) throw new Error('Start date is required for ProcessEvent');
        await new ProcessEventRepository(trx)
          .create({
            codingId: coding.id,
            endDate: pe.event.end_date ? new Date(pe.event.end_date) : undefined,
            startDate: startDate,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const searchProcessEventSetService = (query: Record<string, unknown>): Promise<ProcessEventSet[]> => {
  throw new Error('searchProcessEventSetService not implemented');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteProcessEventSetService = (id: string): Promise<void> => {
  throw new Error('deleteProcessEventSetService not implemented');
};
