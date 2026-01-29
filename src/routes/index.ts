import { Router } from 'express';

import docs from './docs.ts';
import v1 from './v1/index.ts';
import { state } from '../state.ts';
import { Problem } from '../utils/index.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Root Endpoint */
router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    authMode: state.authMode,
    endpoints: ['/api', '/docs', '/live', '/ready'],
    gitRev: state.gitRev
  });
});

/** API Endpoint */
router.get('/api', (_req: Request, res: Response): void => {
  res.status(200).json({ endpoints: ['/v1'] });
});

/** Liveness Endpoint */
router.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({ detail: 'Server is ok' });
});

/** Readiness Endpoint */
router.get('/ready', (req: Request, res: Response): void => {
  if (state.ready) {
    res.status(200).json({ detail: 'Server is ready' });
  } else {
    new Problem(503, { detail: 'Server is not ready' }).send(req, res);
  }
});

/** Teapot Endpoint */
router.get('/teapot', (req: Request, res: Response): void => {
  new Problem(418).send(req, res);
});

router.use('/docs', docs);
router.use('/api/v1', v1);

export default router;
