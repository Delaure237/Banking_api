export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  BUSINESS = 'business',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  CLOSED = 'closed',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  FEE = 'fee',
  INTEREST = 'interest',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum CardType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  PREPAID = 'prepaid',
}

export enum CardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
}

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  PAID_OFF = 'paid_off',
  DEFAULTED = 'defaulted',
}

export enum LoanType {
  PERSONAL = 'personal',
  MORTGAGE = 'mortgage',
  AUTO = 'auto',
  STUDENT = 'student',
  BUSINESS = 'business',
}

export enum UserRole {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  ADMIN = 'admin',
}
