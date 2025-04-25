import { Router } from 'express';

import { Problem } from '../../utils/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Systems */
router.get('/systems', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Get Records */
router.get('/system-records', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Records */
router.delete('/system-records', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
