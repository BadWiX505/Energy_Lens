import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  private authService = new AuthService();

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.signup(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async validateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
      }

      const token = authHeader.replace('Bearer ', '').trim();
      const user = await this.authService.validateUser(token);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
}
