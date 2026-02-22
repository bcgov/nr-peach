import { CodingDictionary } from '../../utils/index.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../types/index.d.ts';

const VERSION = '0.1.0';

/**
 * Seed the database with PIES v0.1.0 definitions.
 * @param db Database
 */
export async function seed(db: Kysely<DB>): Promise<void> {
  await db
    .insertInto('pies.version')
    .values({ id: VERSION })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();

  await db
    .insertInto('pies.coding')
    .values(
      Object.entries(CodingDictionary).flatMap(([codeSystem, codes]) =>
        Object.keys(codes).map((code) => ({ code, codeSystem, versionId: VERSION }))
      )
    )
    .onConflict((oc) => oc.constraint('coding_code_code_system_version_id_unique').doNothing())
    .execute();
}
