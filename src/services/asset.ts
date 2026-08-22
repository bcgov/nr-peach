import { transactionWrapper } from './helpers/index.ts';
import { AssetRepository } from '#src/repositories/index';
import { Problem } from '#src/utils/index';

import type { Selectable } from 'kysely';
import type { PiesAsset } from '#types';

/**
 * Deletes a single asset by its record ID and optionally by system ID.
 * @param assetId - The unique identifier of the record to delete.
 * @param systemId - (Optional) The system ID to further scope the deletion.
 * @returns A promise that resolves when the delete query has executed.
 * @remarks This function does not validate existence/uniqueness. It may delete 0+ rows if `systemId` is omitted.
 */
export const deleteAssetService = async (assetId: string, systemId?: string): Promise<void> => {
  return transactionWrapper(async (trx) => {
    await new AssetRepository(trx).deleteWhere({ assetId: assetId, systemId }).execute();
  });
};

/**
 * Finds a single asset by its record ID and optionally by system ID.
 * @param assetId - The unique identifier of the record to find.
 * @param systemId - (Optional) The system ID to further filter the search.
 * @returns A promise that resolves to the found asset.
 * @throws If no record is found (404) or if multiple records are found without a `systemId` (409).
 */
export const findSingleAssetService = async (assetId: string, systemId?: string): Promise<Selectable<PiesAsset>> => {
  return transactionWrapper(
    async (trx) => {
      const assets = await new AssetRepository(trx).findWhere({ assetId: assetId, systemId }).execute();

      if (!assets.length) {
        const params: Record<string, string> = { record_id: assetId };
        if (systemId) params.system_id = systemId;
        throw new Problem(404, { detail: 'Asset not found' }, params);
      }
      if (assets.length > 1) {
        throw new Problem(
          409,
          { detail: 'Cannot disambiguate intended asset without `system_id`' },
          { record_id: assetId }
        );
      }

      return assets[0]!;
    },
    { accessMode: 'read only' }
  );
};
