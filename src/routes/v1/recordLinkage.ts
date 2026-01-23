import { Router } from 'express';

import {
  deleteRecordLinkageController,
  getRecordLinkagesController,
  putRecordLinkageController
} from '../../controllers/index.ts';
import { authz } from '../../middlewares/index.ts';
import {
  deleteRecordLinkagesSchemaValidator,
  getRecordLinkagesSchemaValidator,
  putRecordLinkagesSchemaValidator
} from '../../validators/index.ts';

const router = Router();

/** Get Record Linkages */
router.get('/record-linkages', getRecordLinkagesSchemaValidator, getRecordLinkagesController);

/** Put Record Linkages */
router.put('/record-linkages', authz('body'), putRecordLinkagesSchemaValidator, putRecordLinkageController);

/** Delete Record Linkages */
router.delete('/record-linkages', authz('query'), deleteRecordLinkagesSchemaValidator, deleteRecordLinkageController);

export default router;
