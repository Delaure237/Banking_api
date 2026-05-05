import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { LoanStatus, LoanType } from '../shared/types';

interface LoanAttributes {
  id: string;
  reference: string;
  userId: string;
  accountId: string;
  type: LoanType;
  status: LoanStatus;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LoanCreationAttributes extends Optional<LoanAttributes, 'id' | 'status' | 'remainingBalance' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {}

class Loan extends Model<LoanAttributes, LoanCreationAttributes> implements LoanAttributes {
  public id!: string;
  public reference!: string;
  public userId!: string;
  public accountId!: string;
  public type!: LoanType;
  public status!: LoanStatus;
  public amount!: number;
  public interestRate!: number;
  public termMonths!: number;
  public monthlyPayment!: number;
  public remainingBalance!: number;
  public startDate!: Date | null;
  public endDate!: Date | null;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Loan.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'accounts', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(LoanType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(LoanStatus)),
      defaultValue: LoanStatus.PENDING,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    termMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    monthlyPayment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Loan',
    tableName: 'loans',
  }
);

export default Loan;
