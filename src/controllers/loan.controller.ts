import { Response, NextFunction } from 'express';
import loanService from '../services/loan.service';
import { AuthenticatedRequest } from '../shared/interfaces';

export class LoanController {
  async apply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await loanService.apply(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Loan application submitted', data: result });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await loanService.approve(req.params.id as string);
      res.json({ success: true, message: 'Loan approved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await loanService.reject(req.params.id as string);
      res.json({ success: true, message: 'Loan rejected', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMyLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await loanService.getByUser(req.user!.id, req.query as any);
      res.json({ success: true, message: 'Loans retrieved', ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await loanService.getById(req.params.id as string);
      res.json({ success: true, message: 'Loan retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async makePayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await loanService.makePayment(req.params.id as string, req.user!.id, req.body.amount);
      res.json({ success: true, message: 'Loan payment successful', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new LoanController();
