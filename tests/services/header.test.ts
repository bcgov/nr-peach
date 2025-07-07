import { TransactionRepository } from '../../src/repositories/transaction.ts';
import { checkDuplicateTransactionHeaderService } from '../../src/services/header.ts';
import { transactionWrapper } from '../../src/services/utils.ts';
import Problem from '../../src/utils/problem.ts';

import type { Mock } from 'vitest';

vi.mock('../../src/services/utils.ts', () => ({
  transactionWrapper: vi.fn()
}));

vi.mock('../../src/repositories/transaction.ts', () => ({
  TransactionRepository: vi.fn()
}));

describe('checkDuplicateTransactionHeaderService', () => {
  const transactionId = 'test-id';
  let readMock: Mock;
  let executeMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    executeMock = vi.fn();
    readMock = vi.fn(() => ({ execute: executeMock }));
    (TransactionRepository as Mock).mockImplementation(() => ({
      read: readMock
    }));
    (transactionWrapper as Mock).mockImplementation((fn: () => Promise<void>) => fn());
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

    await expect(checkDuplicateTransactionHeaderService(transactionId)).rejects.toEqual(
      new Problem(409, { detail: 'Transaction already exists' }, { transaction_id: transactionId })
    );
  });

  it('calls transactionWrapper with accessMode "read only"', async () => {
    executeMock.mockResolvedValue([]);

    await checkDuplicateTransactionHeaderService(transactionId);

    expect(transactionWrapper).toHaveBeenCalledWith(expect.any(Function), { accessMode: 'read only' });
  });
});
