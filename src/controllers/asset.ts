import { deleteAssetService, findSingleAssetService } from '#src/services/index';

import type { Request, Response } from 'express';
import type { AssetQuery } from '#types';

export const deleteAssetController = async (
  req: Request<never, never, never, Required<AssetQuery>>,
  res: Response
): Promise<void> => {
  await findSingleAssetService(req.query.record_id, req.query.system_id);
  await deleteAssetService(req.query.record_id, req.query.system_id);
  res.status(204).end();
};
