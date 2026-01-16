import { Router } from 'express';

import records from './record.ts';
import recordLinkages from './recordLinkage.ts';
import systems from './system.ts';
import { authn } from '../../middlewares/index.ts';

import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    endpoints: ['/records', '/record-linkages', '/systems', '/system-records']
  });
});

router.use(authn());

router.use(records);
router.use(recordLinkages);
router.use(systems);

export default router;
