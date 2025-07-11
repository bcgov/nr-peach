// Always import repository.helper.ts and helpers/index.ts first to ensure mocks are set up
import { executeMock } from './repository.helper.ts';
import { transactionWrapper } from '../../../src/services/helpers/index.ts';

import { ProcessEventRepository } from '../../../src/repositories/index.ts';
import { deleteProcessEventSetService } from '../../../src/services/processEventSet.ts';

import type { Selectable } from 'kysely';
import type { Mock } from 'vitest';
import type { PiesSystemRecord } from '../../../src/types/index.d.ts';

vi.mock('../../../src/utils/index.ts', async () => {
  const actual = await vi.importActual('../../../src/utils/index.ts');
  return {
    ...actual,
    CodingDictionary: {
      SOMECODESYSTEM: {
        '123': { display: 'Test Display', codeSet: 'TestSet' }
      }
    }
  };
});

describe('processEventSetService', () => {
  const systemRecord = {
    id: 1,
    recordKindId: 2,
    systemId: 'sys-1',
    recordId: 'rec-1'
  };

  describe('deleteProcessEventSetService', () => {
    it('should call prune on ProcessEventRepository', async () => {
      executeMock.execute.mockResolvedValue([]);
      const pruneMock = vi.fn().mockImplementation(() => executeMock);
      (ProcessEventRepository as Mock).mockImplementationOnce(() => ({ prune: pruneMock }));

      const result = await deleteProcessEventSetService(systemRecord as Selectable<PiesSystemRecord>);

      expect(result).toEqual([]);
      expect(ProcessEventRepository).toHaveBeenCalledTimes(1);
      expect(transactionWrapper).toHaveBeenCalledTimes(1);
      expect(pruneMock).toHaveBeenCalledWith(systemRecord.id);
      expect(executeMock.execute).toHaveBeenCalledTimes(1);
    });
  });
});
