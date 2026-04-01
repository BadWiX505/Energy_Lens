import { Router } from 'express';
import { DevicesController } from './devices.controller';

const router = Router();
const devicesController = new DevicesController();

router.post('/associate', (req, res, next) => devicesController.associateDevice(req, res, next));
router.get('/', (req, res, next) => devicesController.getDevicesByHomeId(req, res, next));
router.get('/:id', (req, res, next) => devicesController.getDeviceById(req, res, next));
router.put('/:id', (req, res, next) => devicesController.updateDevice(req, res, next));
router.delete('/:id', (req, res, next) => devicesController.disassociateDevice(req, res, next));

export default router;
