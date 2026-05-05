import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { TransactionType, TransactionStatus } from '../shared/types';

interface TransactionAttributes {
  id: string;
  reference: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  balanceAfter: number | null;
  metadata: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'status' | 'currency' | 'balanceAfter' | 'metadata' | 'fromAccountId' | 'toAccountId' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public reference!: string;
  public fromAccountId!: string | null;
  public toAccountId!: string | null;
  public type!: TransactionType;
  public status!: TransactionStatus;
  public amount!: number;
  public currency!: string;
  public description!: string;
  public balanceAfter!: number | null;
  public metadata!: object | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reference: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    fromAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'accounts', key: 'id' },
    },
    toAccountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'accounts', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TransactionType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TransactionStatus)),
      defaultValue: TransactionStatus.PENDING,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    indexes: [
      { fields: ['from_account_id'] },
      { fields: ['to_account_id'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Transaction;
