import {
  checkDuplicateTransactionHeaderService,
  deleteProcessEventSetService,
  findProcessEventSetService,
  findSingleSystemRecordService,
  replaceProcessEventSetService
} from '../services/index.ts';

import type { Request, Response } from 'express';
import type { ProcessEventSet, SystemRecordQuery } from '../types/index.d.ts';

export const deleteProcessEventsController = async (
  req: Request<never, never, never, SystemRecordQuery>,
  res: Response
): Promise<void> => {
  const systemRecord = await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  await deleteProcessEventSetService(systemRecord);
  res.status(204).end();
};

export const getProcessEventsController = async (
  req: Request<never, never, never, SystemRecordQuery>,
  res: Response<ProcessEventSet>
): Promise<void> => {
  const systemRecord = await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  const result = await findProcessEventSetService(systemRecord);
  res.status(200).json(result);
};

export const postProcessEventsController = async (
  req: Request<never, never, ProcessEventSet>,
  res: Response
): Promise<void> => {
  await checkDuplicateTransactionHeaderService(req.body.transaction_id);
  await replaceProcessEventSetService(req.body);
  res.status(202).end();
};

export const putProcessEventsController = async (
  req: Request<never, never, ProcessEventSet>,
  res: Response
): Promise<void> => {
  await checkDuplicateTransactionHeaderService(req.body.transaction_id);
  await replaceProcessEventSetService(req.body);
  res.status(201).end();
};
