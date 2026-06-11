import { LoanService } from '../src/services/loan.service';
import { Loan, Account } from '../src/models';
import { NotFoundError } from '../src/errors';
import { LoanType } from '../src/shared/types';

// Mock dependencies
jest.mock('../src/models', () => ({
  Loan: {
    create: jest.fn(),
  },
  Account: {
    findOne: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
  },
}));

jest.mock('../src/utils/helpers', () => ({
  generateLoanReference: jest.fn().mockReturnValue('LOAN-MOCK-REF'),
  calculateMonthlyPayment: jest.fn().mockImplementation((amount, rate, months) => {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return amount / months;
    return Math.round(
      ((amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)) * 100
    ) / 100;
  }),
  generateTransactionReference: jest.fn().mockReturnValue('TXN-MOCK-REF'),
}));

jest.mock('../src/utils/constants', () => ({
  INTEREST_RATES: {
    PERSONAL_LOAN: 5.5,
    MORTGAGE: 3.2,
    AUTO_LOAN: 4.0,
    STUDENT_LOAN: 3.8,
    BUSINESS_LOAN: 6.0,
  },
}));

const loanService = new LoanService();

describe('LoanService.apply()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC1 - P1 : Compte non trouve ou non lie a l'user
  it('should throw NotFoundError when account does not belong to user', async () => {
    (Account.findOne as jest.Mock).mockResolvedValue(null);

    await expect(loanService.apply('user-id', {
      accountId: 'other-user-account',
      type: LoanType.PERSONAL,
      amount: 10000,
      termMonths: 24,
      description: 'Test loan',
    })).rejects.toThrow('Account not found');
  });

  // TC2 - P2 : Pret personnel (taux 5.5%)
  it('should create a personal loan with correct interest rate', async () => {
    (Account.findOne as jest.Mock).mockResolvedValue({ id: 'account-1', userId: 'user-1' });

    const mockLoan = {
      type: 'personal',
      interestRate: 5.5,
      status: 'pending',
      monthlyPayment: 440.02,
      amount: 10000,
    };
    (Loan.create as jest.Mock).mockResolvedValue(mockLoan);

    const result = await loanService.apply('user-1', {
      accountId: 'account-1',
      type: LoanType.PERSONAL,
      amount: 10000,
      termMonths: 24,
      description: 'Personal loan',
    });

    expect(result.type).toBe('personal');
    expect(result.interestRate).toBe(5.5);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(Loan.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      accountId: 'account-1',
      type: LoanType.PERSONAL,
      amount: 10000,
      interestRate: 5.5,
      termMonths: 24,
    }));
  });

  // TC3 - P2 : Pret hypothecaire (taux 3.2%)
  it('should create a mortgage loan with correct interest rate', async () => {
    (Account.findOne as jest.Mock).mockResolvedValue({ id: 'account-1', userId: 'user-1' });

    const mockLoan = {
      type: 'mortgage',
      interestRate: 3.2,
      status: 'pending',
      monthlyPayment: 1100.50,
      amount: 200000,
    };
    (Loan.create as jest.Mock).mockResolvedValue(mockLoan);

    const result = await loanService.apply('user-1', {
      accountId: 'account-1',
      type: LoanType.MORTGAGE,
      amount: 200000,
      termMonths: 240,
      description: 'Mortgage',
    });

    expect(result.type).toBe('mortgage');
    expect(result.interestRate).toBe(3.2);
    expect(Loan.create).toHaveBeenCalledWith(expect.objectContaining({
      interestRate: 3.2,
      type: LoanType.MORTGAGE,
    }));
  });

  // TC4 - P2 : Pret auto (taux 4.0%)
  it('should create an auto loan with correct interest rate', async () => {
    (Account.findOne as jest.Mock).mockResolvedValue({ id: 'account-1', userId: 'user-1' });

    const mockLoan = {
      type: 'auto',
      interestRate: 4.0,
      status: 'pending',
      monthlyPayment: 460.41,
      amount: 25000,
    };
    (Loan.create as jest.Mock).mockResolvedValue(mockLoan);

    const result = await loanService.apply('user-1', {
      accountId: 'account-1',
      type: LoanType.AUTO,
      amount: 25000,
      termMonths: 60,
      description: 'Car loan',
    });

    expect(result.type).toBe('auto');
    expect(result.interestRate).toBe(4.0);
    expect(Loan.create).toHaveBeenCalledWith(expect.objectContaining({
      interestRate: 4.0,
      type: LoanType.AUTO,
    }));
  });
});
