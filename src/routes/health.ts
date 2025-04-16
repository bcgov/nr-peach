import { Router } from 'express';

import type { Request, Response } from 'express';

const router = Router();

/** Liveness Endpoint */
router.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok' });
});

/** Readiness Endpoint */
router.get('/ready', (_req: Request, res: Response): void => {
  // TODO Add global.database boolean check here to determine readiness
  res.status(200).json({ status: 'ready' });
});

export default router;
