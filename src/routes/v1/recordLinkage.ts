import { Router } from 'express';

import { validationSuccessController } from '#src/controllers/index';
import { authz, isJsonBody } from '#src/middlewares/index';
import { Problem } from '#src/utils/index';
import {
  deleteRecordLinkagesSchemaValidator,
  getRecordLinkagesSchemaValidator,
  putRecordLinkagesSchemaValidator
} from '#src/validators/index';

import type { Request, Response } from 'express';

const router = Router();
const putMiddleware = [isJsonBody(), authz('body'), putRecordLinkagesSchemaValidator];

// Validation-Only Endpoints

/** Put Record Linkages Validation */
router.put('/validate', ...putMiddleware, validationSuccessController);

// Standard Endpoints

/** Get Record Linkages */
router.get('/', getRecordLinkagesSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Put Record Linkages */
router.put('/', ...putMiddleware, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Record Linkages */
router.delete('/', authz('query'), deleteRecordLinkagesSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
