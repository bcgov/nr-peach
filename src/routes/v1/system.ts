import { Router } from 'express';

import { Problem } from '#src/utils/index';
import { getSystemsSchemaValidator } from '#src/validators/index';

import type { Request, Response } from 'express';

const router = Router();

/** Get Systems */
router.get('/', getSystemsSchemaValidator, (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
