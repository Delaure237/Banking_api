import { Op } from 'sequelize';
import { Transaction, Account, sequelize } from '../models';
import { NotFoundError, InsufficientFundsError, BadRequestError } from '../errors';
import { TransactionType, TransactionStatus, AccountStatus } from '../shared/types';
import { PaginationQuery } from '../shared/interfaces';
import { generateTransactionReference, paginate } from '../utils/helpers';
import accountService from './account.service';

export class TransactionService {
  async deposit(data: { accountId: string; amount: number; description?: string }) {
    const account = await accountService.validateAccountActive(data.accountId);

    const t = await sequelize.transaction();
    try {
      const newBalance = Number(account.balance) + data.amount;

      await account.update({ balance: newBalance }, { transaction: t });

      const txn = await Transaction.create(
        {
          reference: generateTransactionReference(),
          toAccountId: data.accountId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          amount: data.amount,
          currency: account.currency,
          description: data.description || 'Cash deposit',
          balanceAfter: newBalance,
        },
        { transaction: t }
      );

      await t.commit();
      return txn;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async withdraw(data: { accountId: string; amount: number; description?: string }) {
    const account = await accountService.validateAccountActive(data.accountId);
    const availableBalance = Number(account.balance) + Number(account.overdraftLimit);

    if (data.amount > availableBalance) {
      throw new InsufficientFundsError();
    }

    const t = await sequelize.transaction();
    try {
      const newBalance = Number(account.balance) - data.amount;

      await account.update({ balance: newBalance }, { transaction: t });

      const txn = await Transaction.create(
        {
          reference: generateTransactionReference(),
          fromAccountId: data.accountId,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.COMPLETED,
          amount: data.amount,
          currency: account.currency,
          description: data.description || 'Cash withdrawal',
          balanceAfter: newBalance,
        },
        { transaction: t }
      );

      await t.commit();
      return txn;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async transfer(data: { fromAccountId: string; toAccountId: string; amount: number; description?: string }) {
    if (data.fromAccountId === data.toAccountId) {
      throw new BadRequestError('Cannot transfer to the same account');
    }

    const fromAccount = await accountService.validateAccountActive(data.fromAccountId);
    const toAccount = await accountService.validateAccountActive(data.toAccountId);

    const availableBalance = Number(fromAccount.balance) + Number(fromAccount.overdraftLimit);
    if (data.amount > availableBalance) {
      throw new InsufficientFundsError();
    }

    const t = await sequelize.transaction();
    try {
      const newFromBalance = Number(fromAccount.balance) - data.amount;
      const newToBalance = Number(toAccount.balance) + data.amount;

      await fromAccount.update({ balance: newFromBalance }, { transaction: t });
      await toAccount.update({ balance: newToBalance }, { transaction: t });

      const txn = await Transaction.create(
        {
          reference: generateTransactionReference(),
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          amount: data.amount,
          currency: fromAccount.currency,
          description: data.description || 'Bank transfer',
          balanceAfter: newFromBalance,
        },
        { transaction: t }
      );

      await t.commit();
      return txn;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getByAccount(accountId: string, pagination: PaginationQuery, filters?: { type?: TransactionType; status?: TransactionStatus; startDate?: string; endDate?: string }) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const where: any = {
      [Op.or]: [{ fromAccountId: accountId }, { toAccountId: accountId }],
    };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [[pagination.sortBy || 'createdAt', pagination.sortOrder || 'DESC']],
      include: [
        { model: Account, as: 'fromAccount', attributes: ['id', 'accountNumber'] },
        { model: Account, as: 'toAccount', attributes: ['id', 'accountNumber'] },
      ],
    });

    return paginate(rows, count, pagination);
  }

  async getById(transactionId: string) {
    const txn = await Transaction.findByPk(transactionId, {
      include: [
        { model: Account, as: 'fromAccount', attributes: ['id', 'accountNumber', 'type'] },
        { model: Account, as: 'toAccount', attributes: ['id', 'accountNumber', 'type'] },
      ],
    });

    if (!txn) throw new NotFoundError('Transaction');
    return txn;
  }
}

export default new TransactionService();
