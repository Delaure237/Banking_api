import { Account, User } from '../models';
import { NotFoundError, BadRequestError, AccountLockedError } from '../errors';
import { AccountStatus, AccountType } from '../shared/types';
import { PaginationQuery } from '../shared/interfaces';
import { generateAccountNumber, generateIBAN, paginate } from '../utils/helpers';

export class AccountService {
  async create(userId: string, data: { type: AccountType; currency?: string }) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User');

    const account = await Account.create({
      userId,
      accountNumber: generateAccountNumber(),
      iban: generateIBAN(),
      type: data.type,
      currency: data.currency || 'EUR',
    });

    return account;
  }

  async getAll(userId: string, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Account.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [[pagination.sortBy || 'createdAt', pagination.sortOrder || 'DESC']],
    });

    return paginate(rows, count, pagination);
  }

  async getById(accountId: string, userId: string) {
    const account = await Account.findOne({
      where: { id: accountId, userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });

    if (!account) throw new NotFoundError('Account');
    return account;
  }

  async getBalance(accountId: string, userId: string) {
    const account = await Account.findOne({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundError('Account');

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
      availableBalance: Number(account.balance) + Number(account.overdraftLimit),
    };
  }

  async updateStatus(accountId: string, status: AccountStatus) {
    const account = await Account.findByPk(accountId);
    if (!account) throw new NotFoundError('Account');

    if (account.status === AccountStatus.CLOSED) {
      throw new BadRequestError('Cannot modify a closed account');
    }

    await account.update({ status });
    return account;
  }

  async updateLimits(accountId: string, userId: string, data: { dailyTransferLimit?: number; dailyWithdrawalLimit?: number; overdraftLimit?: number }) {
    const account = await Account.findOne({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundError('Account');

    await account.update(data);
    return account;
  }

  async closeAccount(accountId: string, userId: string) {
    const account = await Account.findOne({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundError('Account');

    if (Number(account.balance) !== 0) {
      throw new BadRequestError('Account balance must be 0 before closing');
    }

    await account.update({ status: AccountStatus.CLOSED });
    return { message: 'Account closed successfully' };
  }

  async validateAccountActive(accountId: string): Promise<Account> {
    const account = await Account.findByPk(accountId);
    if (!account) throw new NotFoundError('Account');
    if (account.status === AccountStatus.LOCKED) throw new AccountLockedError();
    if (account.status !== AccountStatus.ACTIVE) throw new BadRequestError('Account is not active');
    return account;
  }
}

export default new AccountService();
