import { Router } from 'express';

import {
  deleteProcessEventsController,
  getProcessEventsController,
  postProcessEventsController,
  putProcessEventsController
} from '../../controllers/index.ts';
import {
  deleteProcessEventsSchemaValidator,
  getProcessEventsSchemaValidator,
  postProcessEventsIntegrityValidator,
  postProcessEventsSchemaValidator,
  putProcessEventsIntegrityValidator,
  putProcessEventsSchemaValidator
} from '../../validators/index.ts';

const router = Router();

/** Get Process Events */
router.get('/process-events', getProcessEventsSchemaValidator, getProcessEventsController);

/** Post Process Events */
router.post(
  '/process-events',
  postProcessEventsSchemaValidator,
  postProcessEventsIntegrityValidator,
  postProcessEventsController
);

/** Put Process Events */
router.put(
  '/process-events',
  putProcessEventsSchemaValidator,
  putProcessEventsIntegrityValidator,
  putProcessEventsController
);

/** Delete Process Events */
router.delete('/process-events', deleteProcessEventsSchemaValidator, deleteProcessEventsController);

export default router;
