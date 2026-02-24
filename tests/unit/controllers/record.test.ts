import express from 'express';
import request from 'supertest';

import {
  getRecordController,
  postRecordController,
  pruneRecordController,
  putRecordController
} from '../../../src/controllers/record.ts';
import * as services from '../../../src/services/index.ts';
import { Problem } from '../../../src/utils/index.ts';

import type { Selectable } from 'kysely';
import type { PiesSystemRecord, Record } from '../../../src/types/index.js';

describe('Record Controllers', () => {
  const checkDuplicateTransactionHeaderServiceSpy = vi.spyOn(services, 'checkDuplicateTransactionHeaderService');
  const findRecordServiceSpy = vi.spyOn(services, 'findRecordService');
  const findSingleSystemRecordServiceSpy = vi.spyOn(services, 'findSingleSystemRecordService');
  const pruneRecordServiceSpy = vi.spyOn(services, 'pruneRecordService');
  const replaceRecordServiceSpy = vi.spyOn(services, 'replaceRecordService');

  const fakeSystemRecord = { id: 1 } as Selectable<PiesSystemRecord>;
  const fakeResult = {} as Record;

  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.delete('/records', pruneRecordController);
    app.get('/records', getRecordController);
    app.post('/records', postRecordController);
    app.put('/records', putRecordController);
  });

  describe('DELETE /records', () => {
    it('should call services and respond with 204', async () => {
      findSingleSystemRecordServiceSpy.mockResolvedValue(fakeSystemRecord);
      pruneRecordServiceSpy.mockResolvedValue([]);

      await request(app).delete('/records').query({ record_id: 'rec1', system_id: 'sys1' }).expect(204);

      expect(findSingleSystemRecordServiceSpy).toHaveBeenCalledWith('rec1', 'sys1');
      expect(pruneRecordServiceSpy).toHaveBeenCalledWith(fakeSystemRecord);
    });
  });

  describe('GET /records', () => {
    it('should call services and respond with 200 and result', async () => {
      findSingleSystemRecordServiceSpy.mockResolvedValue(fakeSystemRecord);
      findRecordServiceSpy.mockResolvedValue(fakeResult);

      const res = await request(app).get('/records').query({ record_id: 'rec2', system_id: 'sys2' }).expect(200);

      expect(findSingleSystemRecordServiceSpy).toHaveBeenCalledWith('rec2', 'sys2');
      expect(findRecordServiceSpy).toHaveBeenCalledWith(fakeSystemRecord);
      expect(res.body).toEqual(fakeResult);
    });
  });

  describe('POST /records', () => {
    it('should check for duplicate and replace, respond with 202', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockResolvedValue([]);
      replaceRecordServiceSpy.mockResolvedValue();

      await request(app).post('/records').send({ transaction_id: 'tx1', data: 'abc' }).expect(202);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx1');
      // TODO: Swap to mergeRecordService when implemented
      expect(replaceRecordServiceSpy).toHaveBeenCalledWith(
        { transaction_id: 'tx1', data: 'abc' },
        expect.toSatisfy((v) => v === undefined || typeof v === 'string')
      );
    });

    it('should check for duplicate and halt, respond with 409', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockImplementation(() => {
        throw new Problem(409, { detail: 'Transaction already exists' }, { transaction_id: 'tx1' });
      });
      replaceRecordServiceSpy.mockResolvedValue();

      await request(app).post('/records').send({ transaction_id: 'tx1', data: 'abc' }).expect(409);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx1');
      // TODO: Swap to mergeRecordService when implemented
      expect(replaceRecordServiceSpy).not.toHaveBeenCalled();
    });
  });

  describe('PUT /records', () => {
    it('should check for duplicate and merge, respond with 201', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockResolvedValue([]);
      replaceRecordServiceSpy.mockResolvedValue();

      await request(app).put('/records').send({ transaction_id: 'tx2', data: 'xyz' }).expect(201);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx2');
      expect(replaceRecordServiceSpy).toHaveBeenCalledWith(
        { transaction_id: 'tx2', data: 'xyz' },
        expect.toSatisfy((v) => v === undefined || typeof v === 'string')
      );
    });

    it('should check for duplicate and halt, respond with 409', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockImplementation(() => {
        throw new Problem(409, { detail: 'Transaction already exists' }, { transaction_id: 'tx1' });
      });
      replaceRecordServiceSpy.mockResolvedValue();

      await request(app).post('/records').send({ transaction_id: 'tx1', data: 'abc' }).expect(409);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx1');
      expect(replaceRecordServiceSpy).not.toHaveBeenCalled();
    });
  });
});
