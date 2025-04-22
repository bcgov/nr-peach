import { Router } from 'express';

import Problem from '../../utils/problem.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Process Events */
router.get('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Put Process Events */
router.put('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Delete Process Events */
router.delete('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
