import { Request, Response, NextFunction } from 'express';
import { DevicesService } from './devices.service';

export class DevicesController {
  private devicesService = new DevicesService();

  async associateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceId, homeId, name } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ message: 'Device ID is required' });
      }

      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      if (!name) {
        return res.status(400).json({ message: 'Device name is required' });
      }

      const result = await this.devicesService.associateDevice({
        deviceId,
        homeId,
        name,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDevicesByHomeId(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeId } = req.query;
      
      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const take = req.query.take ? parseInt(req.query.take as string) : 10;

      const result = await this.devicesService.getDevicesByHomeId({
        homeId: homeId as string,
        skip,
        take,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDeviceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeId } = req.query;
      
      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      
      const device = await this.devicesService.getDeviceById({
        id,
        homeId: homeId as string,
      });

      return res.status(200).json(device);
    } catch (error) {
      next(error);
    }
  }

  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeId } = req.query;
      
      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name } = req.body;

      const result = await this.devicesService.updateDevice(id, homeId as string, {
        name,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async disassociateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeId } = req.query;
      
      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const result = await this.devicesService.disassociateDevice({
        id,
        homeId: homeId as string,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
