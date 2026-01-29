import { Router } from 'express';

import { authz } from '../../middlewares/index.ts';
import { Problem } from '../../utils/index.ts';
import {
  deleteRecordsSchemaValidator,
  getRecordsSchemaValidator,
  getSystemsSchemaValidator
} from '../../validators/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Systems */
router.get('/systems', getSystemsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Get Records */
router.get('/system-records', getRecordsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Records */
router.delete('/system-records', authz('query'), deleteRecordsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
