import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { CardType, CardStatus } from '../shared/types';

interface CardAttributes {
  id: string;
  accountId: string;
  userId: string;
  cardNumber: string;
  cardHolderName: string;
  cvv: string;
  type: CardType;
  status: CardStatus;
  expiryDate: Date;
  dailyLimit: number;
  monthlyLimit: number;
  isContactless: boolean;
  isOnlineEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CardCreationAttributes extends Optional<CardAttributes, 'id' | 'status' | 'dailyLimit' | 'monthlyLimit' | 'isContactless' | 'isOnlineEnabled' | 'createdAt' | 'updatedAt'> {}

class Card extends Model<CardAttributes, CardCreationAttributes> implements CardAttributes {
  public id!: string;
  public accountId!: string;
  public userId!: string;
  public cardNumber!: string;
  public cardHolderName!: string;
  public cvv!: string;
  public type!: CardType;
  public status!: CardStatus;
  public expiryDate!: Date;
  public dailyLimit!: number;
  public monthlyLimit!: number;
  public isContactless!: boolean;
  public isOnlineEnabled!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Card.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'accounts', key: 'id' },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    cardNumber: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    cardHolderName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cvv: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(CardType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CardStatus)),
      defaultValue: CardStatus.ACTIVE,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dailyLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 2000,
    },
    monthlyLimit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 30000,
    },
    isContactless: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isOnlineEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Card',
    tableName: 'cards',
  }
);

export default Card;
