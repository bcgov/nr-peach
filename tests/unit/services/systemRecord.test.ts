import { SystemRecordRepository } from '../../../src/repositories/index.ts';
import { findSingleSystemRecordService } from '../../../src/services/systemRecord.ts';
import { transactionWrapper } from '../../../src/services/utils.ts';

import type { Mock } from 'vitest';

vi.mock('../../../src/repositories/index.ts', () => ({
  SystemRecordRepository: vi.fn()
}));

vi.mock('../../../src/services/utils.ts', () => ({
  transactionWrapper: vi.fn()
}));

describe('findSingleSystemRecordService', () => {
  const recordId = 'rec-123';
  const systemId = 'sys-456';
  const mockRecord = { recordId, systemId, foo: 'bar' };

  let findByMock: Mock;
  let executeMock: Mock;

  beforeEach(() => {
    executeMock = vi.fn();
    findByMock = vi.fn(() => ({ execute: executeMock }));
    (SystemRecordRepository as Mock).mockImplementation(() => ({
      findBy: findByMock
    }));
    (transactionWrapper as Mock).mockImplementation((fn: () => Promise<void>) => fn());
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
