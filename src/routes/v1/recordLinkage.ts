import { Router } from 'express';

import { Problem } from '../../utils/index.ts';
import {
  deleteRecordLinkagesSchemaValidator,
  getRecordLinkagesSchemaValidator,
  putRecordLinkagesSchemaValidator
} from '../../validators/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Record Linkages */
router.get('/record-linkages', getRecordLinkagesSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Put Record Linkages */
router.put('/record-linkages', putRecordLinkagesSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Record Linkages */
router.delete('/record-linkages', deleteRecordLinkagesSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
