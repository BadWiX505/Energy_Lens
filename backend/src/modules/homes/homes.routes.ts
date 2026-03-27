import { Router } from 'express';
import { HomesController } from './homes.controller';

const router = Router();
const homesController = new HomesController();

// All homes routes require authentication (handled by middleware)
router.post('/', (req, res, next) => homesController.createHome(req, res, next));
router.get('/', (req, res, next) => homesController.getMyHomes(req, res, next));
router.get('/:id', (req, res, next) => homesController.getHomeById(req, res, next));
router.put('/:id', (req, res, next) => homesController.updateHome(req, res, next));
router.delete('/:id', (req, res, next) => homesController.deleteHome(req, res, next));

export default router;
