import {
  addRecordLinkageService,
  checkDuplicateTransactionHeaderService,
  deleteRecordLinkageService,
  findRecordLinkagesService,
  findSingleSystemRecordService
} from '../services/index.ts';

import type { Request, Response } from 'express';
import type { LinkedSystemRecordQuery, RecordLinkage, SystemRecordQuery } from '../types/index.d.ts';

export const deleteRecordLinkageController = async (
  req: Request<never, never, never, SystemRecordQuery & LinkedSystemRecordQuery>,
  res: Response
): Promise<void> => {
  const systemRecord = await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  const linkedSystemRecord = await findSingleSystemRecordService(
    req.query.linked_record_id,
    req.query.linked_system_id
  );
  await deleteRecordLinkageService(systemRecord, linkedSystemRecord);
  res.status(204).end();
};

export const getRecordLinkagesController = async (
  req: Request<never, never, never, SystemRecordQuery & { depth?: number }>,
  res: Response<RecordLinkage[]>
): Promise<void> => {
  const systemRecord = await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  const result = await findRecordLinkagesService(systemRecord);
  res.status(200).json(result);
};

export const putRecordLinkageController = async (
  req: Request<never, never, RecordLinkage>,
  res: Response
): Promise<void> => {
  await checkDuplicateTransactionHeaderService(req.body.transaction_id);
  await addRecordLinkageService(req.body);
  res.status(202).end();
};
