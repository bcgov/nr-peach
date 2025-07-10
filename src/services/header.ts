import { transactionWrapper } from './helpers/index.ts';
import { TransactionRepository } from '../repositories/index.ts';
import { Problem } from '../utils/index.ts';

/**
 * Checks if a transaction with the given transaction ID already exists.
 * If a transaction with the specified ID is found, it throws a 409 Conflict error.
 * @param transactionId - The unique identifier of the transaction to check for duplicates.
 * @throws {Problem} Throws a 409 error if the transaction already exists.
 * @returns A promise that resolves if no duplicate is found, or rejects with an error if a duplicate exists.
 */
export const checkDuplicateTransactionHeaderService = async (transactionId: string): Promise<void> => {
  return transactionWrapper(
    async (trx) => {
      const transaction = await new TransactionRepository(trx).read(transactionId).execute();
      if (transaction.length > 0) {
        throw new Problem(409, { detail: 'Transaction already exists' }, { transaction_id: transactionId });
      }
    },
    { accessMode: 'read only' }
  );
};
