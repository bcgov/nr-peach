import { TransactionRepository } from '../repositories/index.ts';
import { getLogger, Problem } from '../utils/index.ts';

import type { Request, Response } from 'express';

const log = getLogger(import.meta.filename);

export const deleteProcessEventsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await new TransactionRepository().delete('01950719-b154-72f5-8437-5572df032a69');
    res.status(200).json(Number(result.numDeletedRows));
  } catch (error) {
    log.error('Error deleting transaction:', error);
    new Problem(500, { detail: (error as Error).message }).send(req, res);
  }
};

export const getProcessEventsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await new TransactionRepository().read('01950719-b154-72f5-8437-5572df032a69');
    res.status(200).json(result);
  } catch (error) {
    log.error('Error creating transaction:', error);
    new Problem(500, { detail: (error as Error).message }).send(req, res);
  }
};

export const putProcessEventsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await new TransactionRepository().create({
      id: '01950719-b154-72f5-8437-5572df032a69',
      createdBy: 'SYSTEM'
    });
    res.status(200).json(Number(result.numInsertedOrUpdatedRows));
  } catch (error) {
    log.error('Error creating transaction:', error);
    new Problem(500, { detail: (error as Error).message }).send(req, res);
  }
};

export const postProcessEventsController = putProcessEventsController;
