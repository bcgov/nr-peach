import { Router } from 'express';

import {
  getRecordController,
  postRecordController,
  pruneRecordController,
  putRecordController
} from '../../controllers/index.ts';
import { authz } from '../../middlewares/index.ts';
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
router.post('/records', authz('body'), postRecordSchemaValidator, postRecordIntegrityValidator, postRecordController);

/** Prune Process Events */
router.delete('/records', authz('query'), pruneRecordSchemaValidator, pruneRecordController);

/** Put Process Events */
router.put('/records', authz('body'), putRecordSchemaValidator, putRecordIntegrityValidator, putRecordController);

export default router;
