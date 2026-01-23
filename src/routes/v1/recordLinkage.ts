import { Router } from 'express';

import {
  deleteRecordLinkageController,
  getRecordLinkagesController,
  putRecordLinkageController,
  validationSuccessController
} from '#src/controllers/index';
import { authz, isJsonBody } from '#src/middlewares/index';
import {
  deleteRecordLinkagesSchemaValidator,
  getRecordLinkagesSchemaValidator,
  putRecordLinkagesSchemaValidator
} from '#src/validators/index';

const router = Router();
const putMiddleware = [isJsonBody(), authz('body'), putRecordLinkagesSchemaValidator];

// Validation-Only Endpoints

/** Put Record Linkages Validation */
router.put('/record-linkages/validate', ...putMiddleware, validationSuccessController);

// Standard Endpoints

/** Get Record Linkages */
router.get('/record-linkages', getRecordLinkagesSchemaValidator, getRecordLinkagesController);

/** Put Record Linkages */
router.put('/record-linkages', ...putMiddleware, putRecordLinkageController);

/** Delete Record Linkages */
router.delete('/record-linkages', authz('query'), deleteRecordLinkagesSchemaValidator, deleteRecordLinkageController);

export default router;
