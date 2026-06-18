// Always import repository.helper.ts and helpers/index.ts first to ensure mocks are set up
import { baseRepositoryMock, executeMock } from './repository.helper.ts';
import { transactionWrapper } from '#src/services/helpers/index';

import { AssetRepository } from '#src/repositories/index';
import { deleteAssetService, findSingleAssetService } from '#src/services/asset';

describe('deleteAssetService', () => {
  const recordId = 'rec-123';
  const systemId = 'sys-456';

  it('returns without systemId specified', async () => {
    const result = await deleteAssetService(recordId);

    expect(result).toBeUndefined();
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledWith(expect.anything());
    expect(baseRepositoryMock.deleteWhere).toHaveBeenCalledWith({ recordId });
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });

  it('returns with systemId specified', async () => {
    const result = await deleteAssetService(recordId, systemId);

    expect(result).toBeUndefined();
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledWith(expect.anything());
    expect(baseRepositoryMock.deleteWhere).toHaveBeenCalledWith({ recordId, systemId });
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });
});

describe('findSingleAssetService', () => {
  const recordId = 'rec-123';
  const systemId = 'sys-456';
  const mockRecord = { recordId, systemId, foo: 'bar' };

  it('returns a single asset without systemId specified', async () => {
    executeMock.execute.mockResolvedValue([mockRecord]);

    const result = await findSingleAssetService(recordId);

    expect(result).toEqual(mockRecord);
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledWith(expect.anything());
    expect(baseRepositoryMock.findWhere).toHaveBeenCalledWith({ recordId });
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });

  it('returns a single asset with systemId specified', async () => {
    executeMock.execute.mockResolvedValue([mockRecord]);

    const result = await findSingleAssetService(recordId, systemId);

    expect(result).toEqual(mockRecord);
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledTimes(1);
    expect(AssetRepository).toHaveBeenCalledWith(expect.anything());
    expect(baseRepositoryMock.findWhere).toHaveBeenCalledWith({ recordId, systemId });
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });

  it('throws not found error if no asset found without systemId specified', async () => {
    executeMock.execute.mockResolvedValue([]);

    await expect(findSingleAssetService(recordId)).rejects.toMatchObject({
      status: 404,
      detail: 'Asset not found',
      record_id: recordId
    });
  });

  it('throws not found error if no asset found with systemId specified', async () => {
    executeMock.execute.mockResolvedValue([]);

    await expect(findSingleAssetService(recordId, systemId)).rejects.toMatchObject({
      status: 404,
      detail: 'Asset not found',
      record_id: recordId,
      system_id: systemId
    });
  });

  it('throws conflict error if multiple assets found without systemId specified', async () => {
    executeMock.execute.mockResolvedValue([mockRecord, mockRecord]);

    await expect(findSingleAssetService(recordId)).rejects.toMatchObject({
      status: 409,
      detail: 'Cannot disambiguate intended asset without `system_id`',
      record_id: recordId
    });
  });
});
