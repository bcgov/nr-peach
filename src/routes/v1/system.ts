import { Router } from 'express';

import { deleteSystemRecordController } from '../../controllers/index.ts';
import { authz } from '../../middlewares/index.ts';
import { Problem } from '../../utils/index.ts';
import {
  deleteSystemRecordsSchemaValidator,
  getSystemRecordsSchemaValidator,
  getSystemsSchemaValidator
} from '../../validators/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Systems */
router.get('/systems', getSystemsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Get Records */
router.get('/system-records', getSystemRecordsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Records */
router.delete('/system-records', authz('query'), deleteSystemRecordsSchemaValidator, deleteSystemRecordController);

export default router;
