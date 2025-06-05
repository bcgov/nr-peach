import { TransactionRepository } from '../repositories/index.ts';
import { replaceProcessEventSetService } from '../services/processEventSet.ts';

import type { Request, Response } from 'express';
import type { ProcessEventSet } from '../types/index.js';

export const deleteProcessEventsController = async (req: Request, res: Response): Promise<void> => {
  await new TransactionRepository().delete('01950719-b154-72f5-8437-5572df032a69').execute();
  res.status(200).json({});
};

export const getProcessEventsController = async (req: Request, res: Response): Promise<void> => {
  const result = await new TransactionRepository().read('01950719-b154-72f5-8437-5572df032a69').execute();
  // const result = await new RecordKindRepository().read(1).execute();
  res.status(200).json(result);
};

export const postProcessEventsController = async (
  req: Request<Record<string, string>, unknown, ProcessEventSet>,
  res: Response
): Promise<void> => {
  await replaceProcessEventSetService(req.body);
  res.status(202).end();
};

export const putProcessEventsController = async (
  req: Request<Record<string, string>, unknown, ProcessEventSet>,
  res: Response
): Promise<void> => {
  await replaceProcessEventSetService(req.body);
  res.status(201).end();
};
