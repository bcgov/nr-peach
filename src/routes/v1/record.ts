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
router.post('/records', postRecordSchemaValidator, postRecordIntegrityValidator, authz('body'), postRecordController);

/** Prune Process Events */
router.delete('/records', pruneRecordSchemaValidator, authz('query'), pruneRecordController);

/** Put Process Events */
router.put('/records', putRecordSchemaValidator, putRecordIntegrityValidator, authz('body'), putRecordController);

export default router;
