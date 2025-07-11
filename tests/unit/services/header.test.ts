// Always import repository.helper.ts and helpers/index.ts first to ensure mocks are set up
import { baseRepositoryMock, executeMock } from './repository.helper.ts';
import { transactionWrapper } from '../../../src/services/helpers/index.ts';

import { TransactionRepository } from '../../../src/repositories/index.ts';
import { checkDuplicateTransactionHeaderService } from '../../../src/services/header.ts';

describe('checkDuplicateTransactionHeaderService', () => {
  const transactionId = 'test-id';

  it('resolves if no duplicate transaction is found', async () => {
    executeMock.execute.mockResolvedValue([]);

    const result = await checkDuplicateTransactionHeaderService(transactionId);

    expect(result).toEqual([]);
    expect(transactionWrapper).toHaveBeenCalledTimes(1);
    expect(TransactionRepository).toHaveBeenCalledTimes(1);
    expect(baseRepositoryMock.read).toHaveBeenCalledWith(transactionId);
    expect(executeMock.execute).toHaveBeenCalledTimes(1);
  });

  it('throws a conflict error if duplicate transaction is found', async () => {
    executeMock.execute.mockResolvedValue([{}]);

    await expect(checkDuplicateTransactionHeaderService(transactionId)).rejects.toMatchObject({
      status: 409,
      detail: 'Transaction already exists',
      transaction_id: transactionId
    });
  });

  it('calls transactionWrapper with accessMode "read only"', async () => {
    executeMock.execute.mockResolvedValue([]);

    await checkDuplicateTransactionHeaderService(transactionId);

    expect(transactionWrapper).toHaveBeenCalledWith(expect.any(Function), { accessMode: 'read only' });
  });
});
