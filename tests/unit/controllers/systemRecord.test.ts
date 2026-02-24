import express from 'express';
import request from 'supertest';

import { deleteSystemRecordController } from '../../../src/controllers/systemRecord.ts';
import * as services from '../../../src/services/index.ts';

import type { Selectable } from 'kysely';
import type { PiesSystemRecord } from '../../../src/types/index.js';

describe('System Record Controllers', () => {
  const deleteSystemRecordServiceSpy = vi.spyOn(services, 'deleteSystemRecordService');
  const findSingleSystemRecordServiceSpy = vi.spyOn(services, 'findSingleSystemRecordService');

  const fakeSystemRecord = { id: 1 } as Selectable<PiesSystemRecord>;

  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.delete('/system-records', deleteSystemRecordController);
  });

  describe('DELETE /system-records', () => {
    it('should call services and respond with 204', async () => {
      findSingleSystemRecordServiceSpy.mockResolvedValue(fakeSystemRecord);
      deleteSystemRecordServiceSpy.mockResolvedValue(undefined);

      await request(app).delete('/system-records').query({ record_id: 'rec1', system_id: 'sys1' }).expect(204);

      expect(findSingleSystemRecordServiceSpy).toHaveBeenCalledWith('rec1', 'sys1');
      expect(deleteSystemRecordServiceSpy).toHaveBeenCalledWith('rec1', 'sys1');
    });
  });
});
