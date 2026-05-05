import { Response, NextFunction } from 'express';
import cardService from '../services/card.service';
import { AuthenticatedRequest } from '../shared/interfaces';

export class CardController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.create(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Card created successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.getAllByUser(req.user!.id, req.query as any);
      res.json({ success: true, message: 'Cards retrieved', ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.getById(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Card retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.updateStatus(req.params.id as string, req.user!.id, req.body.status);
      res.json({ success: true, message: 'Card status updated', data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateLimits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.updateLimits(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, message: 'Card limits updated', data: result });
    } catch (error) {
      next(error);
    }
  }

  async toggleContactless(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.toggleContactless(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Contactless toggled', data: result });
    } catch (error) {
      next(error);
    }
  }

  async toggleOnline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.toggleOnline(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Online payments toggled', data: result });
    } catch (error) {
      next(error);
    }
  }

  async blockCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cardService.blockCard(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Card blocked', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new CardController();
