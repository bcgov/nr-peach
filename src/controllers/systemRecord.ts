import { deleteSystemRecordService, findSingleSystemRecordService } from '../services/index.ts';

import type { Request, Response } from 'express';
import type { SystemRecordQuery } from '../types/index.d.ts';

export const deleteSystemRecordController = async (
  req: Request<never, never, never, Required<SystemRecordQuery>>,
  res: Response
): Promise<void> => {
  await findSingleSystemRecordService(req.query.record_id, req.query.system_id);
  await deleteSystemRecordService(req.query.record_id, req.query.system_id);
  res.status(204).end();
};
