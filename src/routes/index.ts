import { Router } from 'express';

import docs from './docs.ts';

import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    endpoints: [
      '/docs',
      '/health',
      '/process-events',
      '/record-linkages',
      '/systems'
    ]
  });
});

router.use('/docs', docs);

export default router;
