import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { AccountType, AccountStatus } from '../shared/types';

interface AccountAttributes {
  id: string;
  userId: string;
  accountNumber: string;
  iban: string;
  type: AccountType;
  status: AccountStatus;
  balance: number;
  currency: string;
  overdraftLimit: number;
  dailyTransferLimit: number;
  dailyWithdrawalLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'status' | 'balance' | 'currency' | 'overdraftLimit' | 'dailyTransferLimit' | 'dailyWithdrawalLimit' | 'createdAt' | 'updatedAt'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: string;
  public userId!: string;
  public accountNumber!: string;
  public iban!: string;
  public type!: AccountType;
  public status!: AccountStatus;
  public balance!: number;
  public currency!: string;
  public overdraftLimit!: number;
  public dailyTransferLimit!: number;
  public dailyWithdrawalLimit!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    iban: {
      type: DataTypes.STRING(34),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(AccountType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AccountStatus)),
      defaultValue: AccountStatus.ACTIVE,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR',
    },
    overdraftLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    dailyTransferLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 50000,
    },
    dailyWithdrawalLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 5000,
    },
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
  }
);

export default Account;
