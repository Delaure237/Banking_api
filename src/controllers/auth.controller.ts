import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AuthenticatedRequest } from '../shared/interfaces';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, message: 'User registered successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ success: true, message: 'Login successful', data: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, message: 'Token refreshed', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user!.id);
      res.json({ success: true, message: 'Profile retrieved', data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, message: 'Profile updated', data: result });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
