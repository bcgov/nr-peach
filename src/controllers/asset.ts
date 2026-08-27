import { deleteAssetService, findSingleAssetService } from '#src/services/index';

import type { Request, Response } from 'express';
import type { AssetQuery } from '#types';

export const deleteAssetController = async (
  req: Request<never, never, never, Required<AssetQuery>>,
  res: Response
): Promise<void> => {
  // TODO: Asset Transition - remove shim for record_id
  await findSingleAssetService(req.query.asset_id ?? req.query.record_id, req.query.system_id);
  await deleteAssetService(req.query.asset_id ?? req.query.record_id, req.query.system_id);
  res.status(204).end();
};
