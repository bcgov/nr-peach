import { Router } from 'express';

import { Problem } from '../../utils/index.ts';
import { putProcessEventsValidator } from '../../validators/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Process Events */
router.get('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Post Process Events */
router.post('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Put Process Events */
router.put(
  '/process-events',
  putProcessEventsValidator,
  (req: Request, res: Response): void => {
    res.status(200).json(req.body);
  }
);

/** Delete Process Events */
router.delete('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
