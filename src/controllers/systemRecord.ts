import { deleteAssetService, findSingleAssetService } from '#src/services/index';

import type { Request, Response } from 'express';
import type { SystemRecordQuery } from '#types';

export const deleteSystemRecordController = async (
  req: Request<never, never, never, Required<SystemRecordQuery>>,
  res: Response
): Promise<void> => {
  await findSingleAssetService(req.query.record_id, req.query.system_id);
  await deleteAssetService(req.query.record_id, req.query.system_id);
  res.status(204).end();
};
