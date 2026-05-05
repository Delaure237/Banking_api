import sequelize from '../config/database';
import User from './User';
import Account from './Account';
import Transaction from './Transaction';
import Card from './Card';
import Beneficiary from './Beneficiary';
import Loan from './Loan';

// Associations
User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Card, { foreignKey: 'userId', as: 'cards' });
Card.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Account.hasMany(Card, { foreignKey: 'accountId', as: 'cards' });
Card.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

Account.hasMany(Transaction, { foreignKey: 'fromAccountId', as: 'outgoingTransactions' });
Account.hasMany(Transaction, { foreignKey: 'toAccountId', as: 'incomingTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'fromAccountId', as: 'fromAccount' });
Transaction.belongsTo(Account, { foreignKey: 'toAccountId', as: 'toAccount' });

User.hasMany(Beneficiary, { foreignKey: 'userId', as: 'beneficiaries' });
Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Account.hasMany(Loan, { foreignKey: 'accountId', as: 'loans' });
Loan.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

export { sequelize, User, Account, Transaction, Card, Beneficiary, Loan };
