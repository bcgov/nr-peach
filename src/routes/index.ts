import { Router } from 'express';

import { state } from '../state.ts';
import docs from './docs.ts';
import v1 from './v1/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Root Endpoint */
router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({ endpoints: ['/api', '/docs', '/live', '/ready'] });
});

/** API Endpoint */
router.get('/api', (_req: Request, res: Response): void => {
  res.status(200).json({ endpoints: ['/v1'] });
});

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

router.use('/docs', docs);
router.use('/api/v1', v1);

export default router;
