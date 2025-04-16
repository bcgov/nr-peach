import { Router } from 'express';

import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    endpoints: ['/process-events', '/record-linkages', '/systems']
  });
});

export default router;
