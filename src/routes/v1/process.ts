import { Router } from 'express';

import {
  deleteProcessEventsController,
  getProcessEventsController,
  postProcessEventsController,
  putProcessEventsController
} from '../../controllers/index.ts';
import {
  deleteProcessEventsValidator,
  getProcessEventsValidator,
  postProcessEventsValidator,
  putProcessEventsValidator
} from '../../validators/index.ts';

const router = Router();

/** Get Process Events */
router.get('/process-events', getProcessEventsValidator, getProcessEventsController);

/** Post Process Events */
router.post('/process-events', postProcessEventsValidator, postProcessEventsController);

/** Put Process Events */
router.put('/process-events', putProcessEventsValidator, putProcessEventsController);

/** Delete Process Events */
router.delete('/process-events', deleteProcessEventsValidator, deleteProcessEventsController);

export default router;
