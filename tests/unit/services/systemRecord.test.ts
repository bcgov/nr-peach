import { SystemRecordRepository } from '../../../src/repositories/index.ts';
import { findSingleSystemRecordService } from '../../../src/services/systemRecord.ts';
import * as repository from '../../../src/services/helpers/repository.ts';

import type { Transaction } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../../src/types/index.d.ts';

vi.mock('../../../src/repositories/index.ts', () => ({
  SystemRecordRepository: vi.fn()
}));

describe('findSingleSystemRecordService', () => {
  const recordId = 'rec-123';
  const systemId = 'sys-456';
  const mockRecord = { recordId, systemId, foo: 'bar' };

  const transactionWrapperSpy = vi.spyOn(repository, 'transactionWrapper');
  const findByMock = vi.fn();
  const executeMock = vi.fn();

  beforeEach(() => {
    findByMock.mockImplementation(() => ({ execute: executeMock }));
    (SystemRecordRepository as Mock).mockImplementation(() => ({
      findBy: findByMock
    }));
    transactionWrapperSpy.mockImplementation((fn: (trx: Transaction<DB>) => Promise<unknown>) =>
      fn({} as Transaction<DB>)
    );
  });

  it('returns a single system record without systemId specified', async () => {
    executeMock.mockResolvedValue([mockRecord]);
    const result = await findSingleSystemRecordService(recordId);
    expect(result).toEqual(mockRecord);
    expect(findByMock).toHaveBeenCalledWith({ recordId });
  });

  it('returns a single system record with systemId specified', async () => {
    executeMock.mockResolvedValue([mockRecord]);
    const result = await findSingleSystemRecordService(recordId, systemId);
    expect(result).toEqual(mockRecord);
    expect(findByMock).toHaveBeenCalledWith({ recordId, systemId });
  });

  it('throws not found error if no system record found without systemId specified', async () => {
    executeMock.mockResolvedValue([]);

    await expect(findSingleSystemRecordService(recordId)).rejects.toMatchObject({
      status: 404,
      detail: 'System record not found',
      record_id: recordId
    });
  });

  it('throws not found error if no system record found with systemId specified', async () => {
    executeMock.mockResolvedValue([]);

    await expect(findSingleSystemRecordService(recordId, systemId)).rejects.toMatchObject({
      status: 404,
      detail: 'System record not found',
      record_id: recordId,
      system_id: systemId
    });
  });

  it('throws conflict error if multiple records found without systemId specified', async () => {
    executeMock.mockResolvedValue([mockRecord, mockRecord]);

    await expect(findSingleSystemRecordService(recordId)).rejects.toMatchObject({
      status: 409,
      detail: 'Cannot disambiguate intended system record without `system_id`',
      record_id: recordId
    });
  });
});
