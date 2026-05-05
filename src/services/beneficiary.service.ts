import { Beneficiary } from '../models';
import { NotFoundError, ConflictError } from '../errors';
import { PaginationQuery } from '../shared/interfaces';
import { paginate } from '../utils/helpers';

export class BeneficiaryService {
  async create(userId: string, data: { name: string; iban: string; bankName: string; bankCode?: string }) {
    const existing = await Beneficiary.findOne({ where: { userId, iban: data.iban } });
    if (existing) throw new ConflictError('Beneficiary with this IBAN already exists');

    const beneficiary = await Beneficiary.create({ userId, ...data });
    return beneficiary;
  }

  async getAll(userId: string, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Beneficiary.findAndCountAll({
      where: { userId, isActive: true },
      limit,
      offset,
      order: [[pagination.sortBy || 'createdAt', pagination.sortOrder || 'DESC']],
    });

    return paginate(rows, count, pagination);
  }

  async getById(beneficiaryId: string, userId: string) {
    const beneficiary = await Beneficiary.findOne({ where: { id: beneficiaryId, userId } });
    if (!beneficiary) throw new NotFoundError('Beneficiary');
    return beneficiary;
  }

  async update(beneficiaryId: string, userId: string, data: Partial<{ name: string; iban: string; bankName: string; bankCode: string }>) {
    const beneficiary = await Beneficiary.findOne({ where: { id: beneficiaryId, userId } });
    if (!beneficiary) throw new NotFoundError('Beneficiary');

    await beneficiary.update(data);
    return beneficiary;
  }

  async delete(beneficiaryId: string, userId: string) {
    const beneficiary = await Beneficiary.findOne({ where: { id: beneficiaryId, userId } });
    if (!beneficiary) throw new NotFoundError('Beneficiary');

    await beneficiary.update({ isActive: false });
    return { message: 'Beneficiary removed successfully' };
  }
}

export default new BeneficiaryService();
