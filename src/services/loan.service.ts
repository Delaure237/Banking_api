import { Loan, Account, sequelize } from '../models';
import { NotFoundError, BadRequestError } from '../errors';
import { LoanStatus, LoanType, TransactionType, TransactionStatus } from '../shared/types';
import { PaginationQuery } from '../shared/interfaces';
import { generateLoanReference, calculateMonthlyPayment, paginate, generateTransactionReference } from '../utils/helpers';
import { INTEREST_RATES } from '../utils/constants';
import { Transaction } from '../models';

export class LoanService {
  async apply(userId: string, data: { accountId: string; type: LoanType; amount: number; termMonths: number; description: string }) {
    const account = await Account.findOne({ where: { id: data.accountId, userId } });
    if (!account) throw new NotFoundError('Account');

    const interestRate = this.getInterestRate(data.type);
    const monthlyPayment = calculateMonthlyPayment(data.amount, interestRate, data.termMonths);

    const loan = await Loan.create({
      reference: generateLoanReference(),
      userId,
      accountId: data.accountId,
      type: data.type,
      amount: data.amount,
      interestRate,
      termMonths: data.termMonths,
      monthlyPayment,
      remainingBalance: data.amount + (monthlyPayment * data.termMonths - data.amount),
      description: data.description,
    });

    return loan;
  }

  async approve(loanId: string) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) throw new NotFoundError('Loan');
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestError('Loan is not in pending status');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + loan.termMonths);

    const t = await sequelize.transaction();
    try {
      await loan.update({ status: LoanStatus.APPROVED, startDate, endDate }, { transaction: t });

      // Disburse loan amount to account
      const account = await Account.findByPk(loan.accountId);
      if (account) {
        const newBalance = Number(account.balance) + Number(loan.amount);
        await account.update({ balance: newBalance }, { transaction: t });

        await Transaction.create(
          {
            reference: generateTransactionReference(),
            toAccountId: loan.accountId,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.COMPLETED,
            amount: Number(loan.amount),
            description: `Loan disbursement - ${loan.reference}`,
            balanceAfter: newBalance,
          },
          { transaction: t }
        );
      }

      await t.commit();
      return loan;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async reject(loanId: string) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) throw new NotFoundError('Loan');
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestError('Loan is not in pending status');

    await loan.update({ status: LoanStatus.REJECTED });
    return loan;
  }

  async getByUser(userId: string, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Loan.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [[pagination.sortBy || 'createdAt', pagination.sortOrder || 'DESC']],
      include: [{ model: Account, as: 'account', attributes: ['id', 'accountNumber'] }],
    });

    return paginate(rows, count, pagination);
  }

  async getById(loanId: string) {
    const loan = await Loan.findByPk(loanId, {
      include: [{ model: Account, as: 'account', attributes: ['id', 'accountNumber', 'type'] }],
    });

    if (!loan) throw new NotFoundError('Loan');
    return loan;
  }

  async makePayment(loanId: string, userId: string, amount: number) {
    const loan = await Loan.findOne({ where: { id: loanId, userId } });
    if (!loan) throw new NotFoundError('Loan');
    if (![LoanStatus.APPROVED, LoanStatus.ACTIVE].includes(loan.status as LoanStatus)) {
      throw new BadRequestError('Loan is not active');
    }

    const newRemaining = Number(loan.remainingBalance) - amount;
    if (newRemaining < 0) throw new BadRequestError('Payment exceeds remaining balance');

    const t = await sequelize.transaction();
    try {
      const status = newRemaining === 0 ? LoanStatus.PAID_OFF : LoanStatus.ACTIVE;
      await loan.update({ remainingBalance: newRemaining, status }, { transaction: t });

      const account = await Account.findByPk(loan.accountId);
      if (account) {
        const newBalance = Number(account.balance) - amount;
        await account.update({ balance: newBalance }, { transaction: t });

        await Transaction.create(
          {
            reference: generateTransactionReference(),
            fromAccountId: loan.accountId,
            type: TransactionType.PAYMENT,
            status: TransactionStatus.COMPLETED,
            amount,
            description: `Loan payment - ${loan.reference}`,
            balanceAfter: newBalance,
          },
          { transaction: t }
        );
      }

      await t.commit();
      return loan;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  private getInterestRate(type: LoanType): number {
    const rates: Record<LoanType, number> = {
      [LoanType.PERSONAL]: INTEREST_RATES.PERSONAL_LOAN,
      [LoanType.MORTGAGE]: INTEREST_RATES.MORTGAGE,
      [LoanType.AUTO]: INTEREST_RATES.AUTO_LOAN,
      [LoanType.STUDENT]: INTEREST_RATES.STUDENT_LOAN,
      [LoanType.BUSINESS]: INTEREST_RATES.BUSINESS_LOAN,
    };
    return rates[type];
  }
}

export default new LoanService();
