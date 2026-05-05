import { Response, NextFunction } from 'express';
import accountService from '../services/account.service';
import { AuthenticatedRequest } from '../shared/interfaces';

export class AccountController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Account created successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.getAll(req.user!.id, req.query as any);
      res.json({ success: true, message: 'Accounts retrieved', ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.getById(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Account retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.getBalance(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Balance retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateLimits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.updateLimits(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, message: 'Account limits updated', data: result });
    } catch (error) {
      next(error);
    }
  }

  async closeAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.closeAccount(req.params.id as string, req.user!.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await accountService.updateStatus(req.params.id as string, req.body.status);
      res.json({ success: true, message: 'Account status updated', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountController();
