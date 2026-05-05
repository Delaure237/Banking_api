import { Response, NextFunction } from 'express';
import transactionService from '../services/transaction.service';
import { AuthenticatedRequest } from '../shared/interfaces';

export class TransactionController {
  async deposit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.deposit(req.body);
      res.status(201).json({ success: true, message: 'Deposit successful', data: result });
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.withdraw(req.body);
      res.status(201).json({ success: true, message: 'Withdrawal successful', data: result });
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.transfer(req.body);
      res.status(201).json({ success: true, message: 'Transfer successful', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getByAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, status, startDate, endDate, ...pagination } = req.query as any;
      const result = await transactionService.getByAccount(req.params.accountId as string, pagination, { type, status, startDate, endDate });
      res.json({ success: true, message: 'Transactions retrieved', ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getById(req.params.id as string);
      res.json({ success: true, message: 'Transaction retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
