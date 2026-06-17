import express from 'express';
import request from 'supertest';

import { deleteAssetController } from '#src/controllers/asset';
import * as services from '#src/services/index';

import type { Selectable } from 'kysely';
import type { PiesAsset } from '#types';

describe('System Record Controllers', () => {
  const deleteAssetServiceSpy = vi.spyOn(services, 'deleteAssetService');
  const findSingleAssetServiceSpy = vi.spyOn(services, 'findSingleAssetService');

  const fakeAsset = { id: 1 } as Selectable<PiesAsset>;

  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.delete('/system-records', deleteAssetController);
  });

  describe('DELETE /system-records', () => {
    it('should call services and respond with 204', async () => {
      findSingleAssetServiceSpy.mockResolvedValue(fakeAsset);
      deleteAssetServiceSpy.mockResolvedValue(undefined);

      await request(app).delete('/system-records').query({ record_id: 'rec1', system_id: 'sys1' }).expect(204);

      expect(findSingleAssetServiceSpy).toHaveBeenCalledWith('rec1', 'sys1');
      expect(deleteAssetServiceSpy).toHaveBeenCalledWith('rec1', 'sys1');
    });
  });
});
