import { TransactionRepository } from '../../../src/repositories/transaction.ts';
import { checkDuplicateTransactionHeaderService } from '../../../src/services/header.ts';
import * as repository from '../../../src/services/helpers/repository.ts';

import type { Transaction } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../../src/types/index.d.ts';

vi.mock('../../../src/repositories/transaction.ts', () => ({
  TransactionRepository: vi.fn()
}));

describe('checkDuplicateTransactionHeaderService', () => {
  const transactionId = 'test-id';

  const transactionWrapperSpy = vi.spyOn(repository, 'transactionWrapper');
  const readMock = vi.fn();
  const executeMock = vi.fn();

  beforeEach(() => {
    readMock.mockImplementation(() => ({ execute: executeMock }));
    (TransactionRepository as Mock).mockImplementation(() => ({
      read: readMock
    }));
    transactionWrapperSpy.mockImplementation((fn: (trx: Transaction<DB>) => Promise<unknown>) =>
      fn({} as Transaction<DB>)
    );
  });

  it('resolves if no duplicate transaction is found', async () => {
    executeMock.mockResolvedValue([]);

    await expect(checkDuplicateTransactionHeaderService(transactionId)).resolves.toBeUndefined();

    expect(TransactionRepository).toHaveBeenCalledTimes(1);
    expect(readMock).toHaveBeenCalledWith(transactionId);
    expect(executeMock).toHaveBeenCalled();
  });

  it('throws a conflict error if duplicate transaction is found', async () => {
    executeMock.mockResolvedValue([{}]);

    await expect(checkDuplicateTransactionHeaderService(transactionId)).rejects.toMatchObject({
      status: 409,
      detail: 'Transaction already exists',
      transaction_id: transactionId
    });
  });

  it('calls transactionWrapper with accessMode "read only"', async () => {
    executeMock.mockResolvedValue([]);

    await checkDuplicateTransactionHeaderService(transactionId);

    expect(transactionWrapperSpy).toHaveBeenCalledWith(expect.any(Function), { accessMode: 'read only' });
  });
});
