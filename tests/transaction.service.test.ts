import { NotFoundError, AccountLockedError, BadRequestError, InsufficientFundsError } from '../src/errors';

const mockValidateAccountActive = jest.fn();
const mockTransactionCreate = jest.fn();
const mockSequelizeTransaction = jest.fn();

jest.mock('../src/models', () => ({
  Transaction: {
    create: (...args: any[]) => mockTransactionCreate(...args),
  },
  Account: {},
  sequelize: {
    transaction: (...args: any[]) => mockSequelizeTransaction(...args),
  },
}));

jest.mock('../src/services/account.service', () => ({
  __esModule: true,
  default: {
    validateAccountActive: (...args: any[]) => mockValidateAccountActive(...args),
  },
  AccountService: jest.fn(),
}));

jest.mock('../src/utils/helpers', () => ({
  generateTransactionReference: jest.fn().mockReturnValue('TXN-MOCK-REF'),
  paginate: jest.fn(),
}));

import { TransactionService } from '../src/services/transaction.service';

const transactionService = new TransactionService();

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

describe('TransactionService.deposit()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSequelizeTransaction.mockResolvedValue(mockTransaction);
  });

  // TC1 - P1 : Compte non trouve
  it('should throw NotFoundError when account does not exist', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new NotFoundError('Account')
    );

    await expect(transactionService.deposit({ accountId: 'non-existent-uuid', amount: 100 }))
      .rejects.toThrow('Account not found');
  });

  // TC2 - P2 : Compte verrouille
  it('should throw AccountLockedError when account is locked', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new AccountLockedError()
    );

    await expect(transactionService.deposit({ accountId: 'locked-id', amount: 100 }))
      .rejects.toThrow('Account is locked');
  });

  // TC3 - P3 : Compte inactif
  it('should throw BadRequestError when account is not active', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new BadRequestError('Account is not active')
    );

    await expect(transactionService.deposit({ accountId: 'inactive-id', amount: 100 }))
      .rejects.toThrow('Account is not active');
  });

  // TC4 - P4 : Depot reussi
  it('should deposit amount and return transaction', async () => {
    const mockAccount = {
      balance: 1000,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    mockValidateAccountActive.mockResolvedValue(mockAccount);

    const mockTxn = {
      amount: 500,
      type: 'deposit',
      status: 'completed',
    };
    mockTransactionCreate.mockResolvedValue(mockTxn);

    const result = await transactionService.deposit({
      accountId: 'active-id', amount: 500, description: 'Test deposit',
    });

    expect(result.amount).toBe(500);
    expect(result.type).toBe('deposit');
    expect(result.status).toBe('completed');
    expect(mockAccount.update).toHaveBeenCalledWith({ balance: 1500 }, { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  // TC5 - P5 : Erreur DB, rollback
  it('should rollback on database error', async () => {
    const mockAccount = {
      balance: 1000,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    mockValidateAccountActive.mockResolvedValue(mockAccount);
    mockTransactionCreate.mockRejectedValue(new Error('DB Error'));

    await expect(transactionService.deposit({ accountId: 'active-id', amount: 100 }))
      .rejects.toThrow('DB Error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});

describe('TransactionService.withdraw()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSequelizeTransaction.mockResolvedValue(mockTransaction);
  });

  // TC1 - P1 : Compte non trouve
  it('should throw NotFoundError when account does not exist', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new NotFoundError('Account')
    );

    await expect(transactionService.withdraw({ accountId: 'fake-uuid', amount: 100 }))
      .rejects.toThrow('Account not found');
  });

  // TC2 - P2 : Compte verrouille
  it('should throw AccountLockedError when account is locked', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new AccountLockedError()
    );

    await expect(transactionService.withdraw({ accountId: 'locked-id', amount: 100 }))
      .rejects.toThrow('Account is locked');
  });

  // TC3 - P3 : Compte ferme
  it('should throw BadRequestError when account is closed', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new BadRequestError('Account is not active')
    );

    await expect(transactionService.withdraw({ accountId: 'closed-id', amount: 100 }))
      .rejects.toThrow('Account is not active');
  });

  // TC4 - P4 : Fonds insuffisants
  it('should throw InsufficientFundsError when amount exceeds balance', async () => {
    const mockAccount = {
      balance: 100,
      overdraftLimit: 0,
      currency: 'EUR',
    };
    mockValidateAccountActive.mockResolvedValue(mockAccount);

    await expect(transactionService.withdraw({ accountId: 'active-id', amount: 99999 }))
      .rejects.toThrow('Insufficient funds');
  });

  // TC5 - P5 : Retrait reussi
  it('should withdraw amount and return transaction', async () => {
    const mockAccount = {
      balance: 1000,
      overdraftLimit: 0,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    mockValidateAccountActive.mockResolvedValue(mockAccount);

    const mockTxn = {
      amount: 50,
      type: 'withdrawal',
      status: 'completed',
    };
    mockTransactionCreate.mockResolvedValue(mockTxn);

    const result = await transactionService.withdraw({ accountId: 'active-id', amount: 50 });

    expect(result.amount).toBe(50);
    expect(result.type).toBe('withdrawal');
    expect(result.status).toBe('completed');
    expect(mockAccount.update).toHaveBeenCalledWith({ balance: 950 }, { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  // TC6 - P6 : Erreur DB, rollback
  it('should rollback on database error', async () => {
    const mockAccount = {
      balance: 1000,
      overdraftLimit: 0,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    mockValidateAccountActive.mockResolvedValue(mockAccount);
    mockTransactionCreate.mockRejectedValue(new Error('DB failure'));

    await expect(transactionService.withdraw({ accountId: 'active-id', amount: 10 }))
      .rejects.toThrow('DB failure');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});

describe('TransactionService.transfer()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSequelizeTransaction.mockResolvedValue(mockTransaction);
  });

  // TC1 - P1 : Meme compte
  it('should throw BadRequestError when transferring to same account', async () => {
    await expect(transactionService.transfer({
      fromAccountId: 'uuid-1', toAccountId: 'uuid-1', amount: 100,
    })).rejects.toThrow('Cannot transfer to the same account');
  });

  // TC2 - P2 : Source non trouve
  it('should throw NotFoundError when source account does not exist', async () => {
    mockValidateAccountActive.mockRejectedValue(
      new NotFoundError('Account')
    );

    await expect(transactionService.transfer({
      fromAccountId: 'non-existent', toAccountId: 'uuid-2', amount: 100,
    })).rejects.toThrow('Account not found');
  });

  // TC3 - P3 : Destination non trouve
  it('should throw NotFoundError when destination account does not exist', async () => {
    const mockFromAccount = {
      balance: 5000,
      overdraftLimit: 0,
      currency: 'EUR',
      update: jest.fn(),
    };
    mockValidateAccountActive
      .mockResolvedValueOnce(mockFromAccount)
      .mockRejectedValueOnce(new NotFoundError('Account'));

    await expect(transactionService.transfer({
      fromAccountId: 'uuid-1', toAccountId: 'non-existent', amount: 100,
    })).rejects.toThrow('Account not found');
  });

  // TC4 - P4 : Fonds insuffisants
  it('should throw InsufficientFundsError when balance is too low', async () => {
    const mockFromAccount = {
      balance: 50,
      overdraftLimit: 0,
      currency: 'EUR',
    };
    const mockToAccount = {
      balance: 1000,
      currency: 'EUR',
    };
    mockValidateAccountActive
      .mockResolvedValueOnce(mockFromAccount)
      .mockResolvedValueOnce(mockToAccount);

    await expect(transactionService.transfer({
      fromAccountId: 'uuid-1', toAccountId: 'uuid-2', amount: 999999,
    })).rejects.toThrow('Insufficient funds');
  });

  // TC5 - P5 : Transfert reussi
  it('should transfer amount between accounts successfully', async () => {
    const mockFromAccount = {
      balance: 5000,
      overdraftLimit: 0,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    const mockToAccount = {
      balance: 1000,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    mockValidateAccountActive
      .mockResolvedValueOnce(mockFromAccount)
      .mockResolvedValueOnce(mockToAccount);

    const mockTxn = {
      type: 'transfer',
      amount: 200,
      status: 'completed',
    };
    mockTransactionCreate.mockResolvedValue(mockTxn);

    const result = await transactionService.transfer({
      fromAccountId: 'uuid-1', toAccountId: 'uuid-2', amount: 200,
    });

    expect(result.type).toBe('transfer');
    expect(result.amount).toBe(200);
    expect(result.status).toBe('completed');
    expect(mockFromAccount.update).toHaveBeenCalledWith({ balance: 4800 }, { transaction: mockTransaction });
    expect(mockToAccount.update).toHaveBeenCalledWith({ balance: 1200 }, { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  // TC6 - P6 : Erreur DB, rollback
  it('should rollback both accounts on database error', async () => {
    const mockFromAccount = {
      balance: 5000,
      overdraftLimit: 0,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    const mockToAccount = {
      balance: 1000,
      currency: 'EUR',
      update: jest.fn().mockResolvedValue(true),
    };
    mockValidateAccountActive
      .mockResolvedValueOnce(mockFromAccount)
      .mockResolvedValueOnce(mockToAccount);
    mockTransactionCreate.mockRejectedValue(new Error('Network error'));

    await expect(transactionService.transfer({
      fromAccountId: 'uuid-1', toAccountId: 'uuid-2', amount: 100,
    })).rejects.toThrow('Network error');
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
