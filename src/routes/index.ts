import { Router } from 'express';

import docs from './docs.ts';
import health from './health.ts';
import v1 from './v1/index.ts';

import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({ endpoints: ['/api', '/docs', '/live', '/ready'] });
});

router.get('/api', (_req: Request, res: Response): void => {
  res.status(200).json({ endpoints: ['/v1'] });
});

router.use('/api/v1', v1);
router.use('/docs', docs);
router.use(health);

export default router;
