import { Router } from 'express';

import {
  getRecordController,
  postRecordController,
  pruneRecordController,
  putRecordController
} from '#src/controllers/index';
import { authz } from '#src/middlewares/index';
import {
  getRecordSchemaValidator,
  postRecordIntegrityValidator,
  postRecordSchemaValidator,
  pruneRecordSchemaValidator,
  putRecordIntegrityValidator,
  putRecordSchemaValidator
} from '#src/validators/index';

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
