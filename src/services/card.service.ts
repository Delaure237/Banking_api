import { Card, Account, User } from '../models';
import { NotFoundError, BadRequestError } from '../errors';
import { CardType, CardStatus } from '../shared/types';
import { PaginationQuery } from '../shared/interfaces';
import { generateCardNumber, generateCVV, paginate } from '../utils/helpers';

export class CardService {
  async create(userId: string, data: { accountId: string; type: CardType }) {
    const account = await Account.findOne({ where: { id: data.accountId, userId } });
    if (!account) throw new NotFoundError('Account');

    const user = await User.findByPk(userId);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    const card = await Card.create({
      accountId: data.accountId,
      userId,
      cardNumber: generateCardNumber(),
      cardHolderName: user ? `${user.firstName} ${user.lastName}`.toUpperCase() : 'CARD HOLDER',
      cvv: generateCVV(),
      type: data.type,
      expiryDate,
    });

    return card;
  }

  async getAllByUser(userId: string, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Card.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [[pagination.sortBy || 'createdAt', pagination.sortOrder || 'DESC']],
      include: [{ model: Account, as: 'account', attributes: ['id', 'accountNumber', 'type'] }],
    });

    return paginate(rows, count, pagination);
  }

  async getById(cardId: string, userId: string) {
    const card = await Card.findOne({
      where: { id: cardId, userId },
      include: [{ model: Account, as: 'account', attributes: ['id', 'accountNumber', 'type'] }],
    });

    if (!card) throw new NotFoundError('Card');
    return card;
  }

  async updateStatus(cardId: string, userId: string, status: CardStatus) {
    const card = await Card.findOne({ where: { id: cardId, userId } });
    if (!card) throw new NotFoundError('Card');

    if (card.status === CardStatus.EXPIRED) {
      throw new BadRequestError('Cannot modify an expired card');
    }

    await card.update({ status });
    return card;
  }

  async updateLimits(cardId: string, userId: string, data: { dailyLimit?: number; monthlyLimit?: number }) {
    const card = await Card.findOne({ where: { id: cardId, userId } });
    if (!card) throw new NotFoundError('Card');

    await card.update(data);
    return card;
  }

  async toggleContactless(cardId: string, userId: string) {
    const card = await Card.findOne({ where: { id: cardId, userId } });
    if (!card) throw new NotFoundError('Card');

    await card.update({ isContactless: !card.isContactless });
    return card;
  }

  async toggleOnline(cardId: string, userId: string) {
    const card = await Card.findOne({ where: { id: cardId, userId } });
    if (!card) throw new NotFoundError('Card');

    await card.update({ isOnlineEnabled: !card.isOnlineEnabled });
    return card;
  }

  async blockCard(cardId: string, userId: string) {
    return this.updateStatus(cardId, userId, CardStatus.BLOCKED);
  }
}

export default new CardService();
