import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authService = new AuthService();

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      return res.status(401).json({ message: 'Token is required' });
    }

    const user = await authService.validateUser(token);
    req.user = user;
    
    next();
  } catch (error: any) {
    return res.status(401).json({ 
      message: error.message || 'Authentication failed' 
    });
  }
}
