import { Router } from 'express';

import { Problem } from '../../utils/index.ts';
import {
  deleteProcessEventsValidator,
  getProcessEventsValidator,
  postProcessEventsValidator,
  putProcessEventsValidator
} from '../../validators/process.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Process Events */
router.get(
  '/process-events',
  getProcessEventsValidator,
  (req: Request, res: Response): void => {
    new Problem(501).send(req, res);
  }
);

/** Post Process Events */
router.post(
  '/process-events',
  postProcessEventsValidator,
  (req: Request, res: Response): void => {
    new Problem(501).send(req, res);
  }
);

/** Put Process Events */
router.put(
  '/process-events',
  putProcessEventsValidator,
  (req: Request, res: Response): void => {
    new Problem(501).send(req, res);
  }
);

/** Delete Process Events */
router.delete(
  '/process-events',
  deleteProcessEventsValidator,
  (req: Request, res: Response): void => {
    new Problem(501).send(req, res);
  }
);

export default router;
