import { Router } from 'express';

import { state } from '../../server.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Liveness Endpoint */
router.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok' });
});

/** Readiness Endpoint */
router.get('/ready', (_req: Request, res: Response): void => {
  if (state.ready) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;
