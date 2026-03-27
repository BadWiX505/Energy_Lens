import { Request, Response, NextFunction } from 'express';
import { HomesService } from './homes.service';

export class HomesController {
  private homesService = new HomesService();

  async createHome(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { name, location } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Home name is required' });
      }

      const result = await this.homesService.createHome({
        userId,
        name,
        location,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMyHomes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const take = req.query.take ? parseInt(req.query.take as string) : 10;

      const result = await this.homesService.getHomesByUserId({
        userId,
        skip,
        take,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHomeById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      
      const home = await this.homesService.getHomeById({
        id,
        userId,
      });

      return res.status(200).json(home);
    } catch (error) {
      next(error);
    }
  }

  async updateHome(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, location } = req.body;

      const result = await this.homesService.updateHome(id, userId, {
        name,
        location,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteHome(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const result = await this.homesService.deleteHome({
        id,
        userId,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
