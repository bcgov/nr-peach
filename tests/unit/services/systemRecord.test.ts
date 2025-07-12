// Always import repository.helper.ts and helpers/index.ts first to ensure mocks are set up
import { baseRepositoryMock, executeMock } from './repository.helper.ts';
import { transactionWrapper } from '../../../src/services/helpers/index.ts';

import { SystemRecordRepository } from '../../../src/repositories/index.ts';
import { findSingleSystemRecordService } from '../../../src/services/systemRecord.ts';

describe('findSingleSystemRecordService', () => {
  const recordId = 'rec-123';
  const systemId = 'sys-456';
  const mockRecord = { recordId, systemId, foo: 'bar' };

  it('returns a single system record without systemId specified', async () => {
    executeMock.execute.mockResolvedValue([mockRecord]);

    const result = await findSingleSystemRecordService(recordId);

    expect(result).toEqual(mockRecord);
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(SystemRecordRepository).toHaveBeenCalledTimes(1);
    expect(SystemRecordRepository).toHaveBeenCalledWith(expect.anything());
    expect(baseRepositoryMock.findBy).toHaveBeenCalledWith({ recordId });
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });

  it('returns a single system record with systemId specified', async () => {
    executeMock.execute.mockResolvedValue([mockRecord]);

    const result = await findSingleSystemRecordService(recordId, systemId);

    expect(result).toEqual(mockRecord);
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(SystemRecordRepository).toHaveBeenCalledTimes(1);
    expect(SystemRecordRepository).toHaveBeenCalledWith(expect.anything());
    expect(baseRepositoryMock.findBy).toHaveBeenCalledWith({ recordId, systemId });
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });

  it('throws not found error if no system record found without systemId specified', async () => {
    executeMock.execute.mockResolvedValue([]);

    await expect(findSingleSystemRecordService(recordId)).rejects.toMatchObject({
      status: 404,
      detail: 'System record not found',
      record_id: recordId
    });
  });

  it('throws not found error if no system record found with systemId specified', async () => {
    executeMock.execute.mockResolvedValue([]);

    await expect(findSingleSystemRecordService(recordId, systemId)).rejects.toMatchObject({
      status: 404,
      detail: 'System record not found',
      record_id: recordId,
      system_id: systemId
    });
  });

  it('throws conflict error if multiple records found without systemId specified', async () => {
    executeMock.execute.mockResolvedValue([mockRecord, mockRecord]);

    await expect(findSingleSystemRecordService(recordId)).rejects.toMatchObject({
      status: 409,
      detail: 'Cannot disambiguate intended system record without `system_id`',
      record_id: recordId
    });
  });
});
