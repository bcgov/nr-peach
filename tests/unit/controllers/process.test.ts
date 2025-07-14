import express from 'express';
import request from 'supertest';

import {
  deleteProcessEventsController,
  getProcessEventsController,
  postProcessEventsController,
  putProcessEventsController
} from '../../../src/controllers/process.ts';
import * as services from '../../../src/services/index.ts';
import { Problem } from '../../../src/utils/index.ts';

import type { Selectable } from 'kysely';
import type { PiesSystemRecord, ProcessEventSet } from '../../../src/types/index.js';

describe('Process Controllers', () => {
  const checkDuplicateTransactionHeaderServiceSpy = vi.spyOn(services, 'checkDuplicateTransactionHeaderService');
  const deleteProcessEventSetServiceSpy = vi.spyOn(services, 'deleteProcessEventSetService');
  const findProcessEventSetServiceSpy = vi.spyOn(services, 'findProcessEventSetService');
  const findSingleSystemRecordServiceSpy = vi.spyOn(services, 'findSingleSystemRecordService');
  const replaceProcessEventSetServiceSpy = vi.spyOn(services, 'replaceProcessEventSetService');

  const fakeSystemRecord = { id: 1 } as Selectable<PiesSystemRecord>;
  const fakeResult = {} as ProcessEventSet;

  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.delete('/process-events', deleteProcessEventsController);
    app.get('/process-events', getProcessEventsController);
    app.post('/process-events', postProcessEventsController);
    app.put('/process-events', putProcessEventsController);
  });

  describe('DELETE /process-events', () => {
    it('should call services and respond with 204', async () => {
      findSingleSystemRecordServiceSpy.mockResolvedValue(fakeSystemRecord);
      deleteProcessEventSetServiceSpy.mockResolvedValue([]);

      await request(app).delete('/process-events').query({ record_id: 'rec1', system_id: 'sys1' }).expect(204);

      expect(findSingleSystemRecordServiceSpy).toHaveBeenCalledWith('rec1', 'sys1');
      expect(deleteProcessEventSetServiceSpy).toHaveBeenCalledWith(fakeSystemRecord);
    });
  });

  describe('GET /process-events', () => {
    it('should call services and respond with 200 and result', async () => {
      findSingleSystemRecordServiceSpy.mockResolvedValue(fakeSystemRecord);
      findProcessEventSetServiceSpy.mockResolvedValue(fakeResult);

      const res = await request(app).get('/process-events').query({ record_id: 'rec2', system_id: 'sys2' }).expect(200);

      expect(findSingleSystemRecordServiceSpy).toHaveBeenCalledWith('rec2', 'sys2');
      expect(findProcessEventSetServiceSpy).toHaveBeenCalledWith(fakeSystemRecord);
      expect(res.body).toEqual(fakeResult);
    });
  });

  describe('POST /process-events', () => {
    it('should check for duplicate and replace, respond with 202', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockResolvedValue([]);
      replaceProcessEventSetServiceSpy.mockResolvedValue([]);

      await request(app).post('/process-events').send({ transaction_id: 'tx1', data: 'abc' }).expect(202);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx1');
      // TODO: Swap to mergeProcessEventSetService when implemented
      expect(replaceProcessEventSetServiceSpy).toHaveBeenCalledWith({ transaction_id: 'tx1', data: 'abc' });
    });

    it('should check for duplicate and halt, respond with 409', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockImplementation(() => {
        throw new Problem(409, { detail: 'Transaction already exists' }, { transaction_id: 'tx1' });
      });
      replaceProcessEventSetServiceSpy.mockResolvedValue([]);

      await request(app).post('/process-events').send({ transaction_id: 'tx1', data: 'abc' }).expect(409);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx1');
      // TODO: Swap to mergeProcessEventSetService when implemented
      expect(replaceProcessEventSetServiceSpy).not.toHaveBeenCalled();
    });
  });

  describe('PUT /process-events', () => {
    it('should check for duplicate and merge, respond with 201', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockResolvedValue([]);
      replaceProcessEventSetServiceSpy.mockResolvedValue([]);

      await request(app).put('/process-events').send({ transaction_id: 'tx2', data: 'xyz' }).expect(201);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx2');
      expect(replaceProcessEventSetServiceSpy).toHaveBeenCalledWith({ transaction_id: 'tx2', data: 'xyz' });
    });

    it('should check for duplicate and halt, respond with 409', async () => {
      checkDuplicateTransactionHeaderServiceSpy.mockImplementation(() => {
        throw new Problem(409, { detail: 'Transaction already exists' }, { transaction_id: 'tx1' });
      });
      replaceProcessEventSetServiceSpy.mockResolvedValue([]);

      await request(app).post('/process-events').send({ transaction_id: 'tx1', data: 'abc' }).expect(409);

      expect(checkDuplicateTransactionHeaderServiceSpy).toHaveBeenCalledWith('tx1');
      expect(replaceProcessEventSetServiceSpy).not.toHaveBeenCalled();
    });
  });
});
