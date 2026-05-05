import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BeneficiaryAttributes {
  id: string;
  userId: string;
  name: string;
  iban: string;
  bankName: string;
  bankCode: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BeneficiaryCreationAttributes extends Optional<BeneficiaryAttributes, 'id' | 'bankCode' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Beneficiary extends Model<BeneficiaryAttributes, BeneficiaryCreationAttributes> implements BeneficiaryAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public iban!: string;
  public bankName!: string;
  public bankCode!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Beneficiary.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    iban: {
      type: DataTypes.STRING(34),
      allowNull: false,
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    bankCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Beneficiary',
    tableName: 'beneficiaries',
  }
);

export default Beneficiary;
