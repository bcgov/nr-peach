import { Router } from 'express';

import processes from './record.ts';
import records from './recordLinkage.ts';
import systems from './system.ts';

import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    endpoints: ['/process-events', '/record-linkages', '/systems', '/system-records']
  });
});

router.use(processes);
router.use(records);
router.use(systems);

export default router;
