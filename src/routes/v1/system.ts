import { Router } from 'express';

import { deleteSystemRecordController } from '#src/controllers/index';
import { authz } from '#src/middlewares/index';
import { Problem } from '#src/utils/index';
import {
  deleteSystemRecordsSchemaValidator,
  getSystemRecordsSchemaValidator,
  getSystemsSchemaValidator
} from '#src/validators/index';

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
