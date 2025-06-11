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
export const mergeProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  throw new Error('mergeProcessEventSetService not implemented');
};

export const replaceProcessEventSetService = (data: ProcessEventSet): Promise<void> => {
  return transactionWrapper(async (trx) => {
    // TODO: Should we extract this to be its own middleware or part of the validation stack?
    // Validate ProcessEvent element contents
    data.process_event.forEach((pe, index) => {
      if (!isValidCoding(pe.process.code_system, pe.process.code)) {
        throw new Problem(
          422,
          { detail: `Invalid ProcessEvent element at index ${index}` },
          { errors: { code: pe.process.code, codeSystem: pe.process.code_system } }
        );
      }
    });

    // Update atomic fact tables
    await Promise.all([
      new TransactionRepository(trx).create({ id: data.transaction_id }).execute(),
      returnableUpsert(new SystemRepository(trx), { id: data.system_id }),
      returnableUpsert(new VersionRepository(trx), { id: data.version })
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

    // Prune existing process events for the system record
    await new ProcessEventRepository(trx).prune(systemRecord.id).execute();

    // Insert new process events
    await Promise.all(
      data.process_event.map(async (pe) => {
        const coding = await returnableUpsert(new CodingRepository(trx), {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const searchProcessEventSetService = (query: Record<string, unknown>): Promise<ProcessEventSet[]> => {
  throw new Error('searchProcessEventSetService not implemented');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteProcessEventSetService = (id: string): Promise<void> => {
  throw new Error('deleteProcessEventSetService not implemented');
};
