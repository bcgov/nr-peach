import { Router } from 'express';

import {
  getRecordController,
  postRecordController,
  pruneRecordController,
  putRecordController
} from '../../controllers/index.ts';
import {
  getRecordSchemaValidator,
  postRecordIntegrityValidator,
  postRecordSchemaValidator,
  pruneRecordSchemaValidator,
  putRecordIntegrityValidator,
  putRecordSchemaValidator
} from '../../validators/index.ts';

const router = Router();

/** Get Process Events */
router.get('/records', getRecordSchemaValidator, getRecordController);

/** Post Process Events */
router.post('/records', postRecordSchemaValidator, postRecordIntegrityValidator, postRecordController);

/** Prune Process Events */
router.delete('/records', pruneRecordSchemaValidator, pruneRecordController);

/** Put Process Events */
router.put('/records', putRecordSchemaValidator, putRecordIntegrityValidator, putRecordController);

export default router;
