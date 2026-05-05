import { Response, NextFunction } from 'express';
import beneficiaryService from '../services/beneficiary.service';
import { AuthenticatedRequest } from '../shared/interfaces';

export class BeneficiaryController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await beneficiaryService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Beneficiary added', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await beneficiaryService.getAll(req.user!.id, req.query as any);
      res.json({ success: true, message: 'Beneficiaries retrieved', ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await beneficiaryService.getById(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Beneficiary retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await beneficiaryService.update(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, message: 'Beneficiary updated', data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await beneficiaryService.delete(req.params.id as string, req.user!.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new BeneficiaryController();
