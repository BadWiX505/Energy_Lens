import { Router, Request, Response, NextFunction } from 'express';
import authRouter from './modules/auth/auth.routes';
import homesRouter from './modules/homes/homes.routes';
import { authenticateUser } from './modules/auth/auth.middleware';

const router = Router();

// Mount auth routes (signup/login are public)
router.use('/auth', authRouter);

// Apply authentication middleware to all routes after auth
// This ensures only authenticated users can access other endpoints
router.use((req: Request, res: Response, next: NextFunction) => {
  // Skip auth middleware for signup and login endpoints
  if (req.path.startsWith('/auth/signup') || req.path.startsWith('/auth/login')) {
    return next();
  }
  
  authenticateUser(req, res, next);
});

// Mount authenticated routes
router.use('/homes', homesRouter);

export default router;
