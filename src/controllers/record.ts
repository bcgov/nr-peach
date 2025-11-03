import {
  checkDuplicateTransactionHeaderService,
  pruneRecordService,
  findRecordService,
  findSingleSystemRecordService,
  replaceRecordService
} from '../services/index.ts';

import type { Request, Response } from 'express';
import type { Record, SystemRecordQuery } from '../types/index.d.ts';

export const getRecordController = async (
  req: Request<never, never, never, SystemRecordQuery>,
  res: Response<Record>
): Promise<void> => {
  const systemRecord = await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  const result = await findRecordService(systemRecord);
  res.status(200).json(result);
};

export const postRecordController = async (req: Request<never, never, Record>, res: Response): Promise<void> => {
  await checkDuplicateTransactionHeaderService(req.body.transaction_id);
  await replaceRecordService(req.body);
  res.status(202).end();
};

export const pruneRecordController = async (
  req: Request<never, never, never, SystemRecordQuery>,
  res: Response
): Promise<void> => {
  const systemRecord = await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  await pruneRecordService(systemRecord);
  res.status(204).end();
};

export const putRecordController = async (req: Request<never, never, Record>, res: Response): Promise<void> => {
  await checkDuplicateTransactionHeaderService(req.body.transaction_id);
  await replaceRecordService(req.body);
  res.status(201).end();
};
