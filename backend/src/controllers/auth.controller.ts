import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      const result = await authService.register(email, password, name);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      res.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Invalid input' });
        return;
      }
      next(err);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.userId!);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.userId!, req.body);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
