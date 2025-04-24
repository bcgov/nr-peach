import { Router } from 'express';

import { validateSchema } from '../../validators/index.ts';
import Problem from '../../utils/problem.ts';

import type { Request, Response } from 'express';

const router = Router();

/** Get Process Events */
router.get('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

/** Put Process Events */
router.put(
  '/process-events',
  async (req: Request, res: Response): Promise<void> => {
    const schemaUri =
      'https://raw.githubusercontent.com/bcgov/nr-pies/refs/heads/main/docs/spec/message/process_event_set.schema.json';
    const valid = await validateSchema(schemaUri, req.body);
    // if (!valid) new Problem(422).send(req, res);
    res.status(200).json(valid);
  }
);

/** Delete Process Events */
router.delete('/process-events', (req: Request, res: Response): void => {
  new Problem(501).send(req, res);
});

export default router;
