import { Router } from 'express';

import {
  getRecordController,
  postRecordController,
  pruneRecordController,
  putRecordController,
  validationSuccessController
} from '#src/controllers/index';
import { authz, isJsonBody } from '#src/middlewares/index';
import {
  getRecordSchemaValidator,
  postRecordIntegrityValidator,
  postRecordSchemaValidator,
  pruneRecordSchemaValidator,
  putRecordIntegrityValidator,
  putRecordSchemaValidator
} from '#src/validators/index';

const router = Router();
const postMiddleware = [isJsonBody(), authz('body'), postRecordSchemaValidator, postRecordIntegrityValidator];
const putMiddleware = [isJsonBody(), authz('body'), putRecordSchemaValidator, putRecordIntegrityValidator];

// Validation-Only Endpoints

/** Post Records Validation */
router.post('/records/validate', ...postMiddleware, validationSuccessController);

/** Put Records Validation */
router.put('/records/validate', ...putMiddleware, validationSuccessController);

// Standard Endpoints

/** Get Records */
router.get('/records', getRecordSchemaValidator, getRecordController);

/** Post Records */
router.post('/records', ...postMiddleware, postRecordController);

/** Prune Records */
router.delete('/records', authz('query'), pruneRecordSchemaValidator, pruneRecordController);

/** Put Records */
router.put('/records', ...putMiddleware, putRecordController);

export default router;
