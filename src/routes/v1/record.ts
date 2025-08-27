import { Router } from 'express';

import {
  deleteRecordController,
  getRecordController,
  postRecordController,
  putRecordController
} from '../../controllers/index.ts';
import {
  deleteRecordSchemaValidator,
  getRecordSchemaValidator,
  postRecordIntegrityValidator,
  postRecordSchemaValidator,
  putRecordIntegrityValidator,
  putRecordSchemaValidator
} from '../../validators/index.ts';

const router = Router();

/** Get Process Events */
router.get('/records', getRecordSchemaValidator, getRecordController);

/** Post Process Events */
router.post('/records', postRecordSchemaValidator, postRecordIntegrityValidator, postRecordController);

/** Put Process Events */
router.put('/records', putRecordSchemaValidator, putRecordIntegrityValidator, putRecordController);

/** Delete Process Events */
router.delete('/records', deleteRecordSchemaValidator, deleteRecordController);

export default router;
