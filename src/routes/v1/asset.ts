import { Router } from 'express';

import { deleteAssetController } from '#src/controllers/index';
import { authz } from '#src/middlewares/index';
import { Problem } from '#src/utils/index';
import { deleteAssetsSchemaValidator, getAssetsSchemaValidator } from '#src/validators/index';

import type { Request, Response } from 'express';

const router = Router();

/** Get Assets */
router.get('/', getAssetsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Assets */
router.delete('/', authz('query'), deleteAssetsSchemaValidator, deleteAssetController);

export default router;
