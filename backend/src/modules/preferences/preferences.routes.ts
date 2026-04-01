import { Router } from 'express';
import { PreferencesController } from './preferences.controller';

const router = Router();
const preferencesController = new PreferencesController();

router.post('/', (req, res, next) => preferencesController.createPreference(req, res, next));
router.get('/', (req, res, next) => preferencesController.getPreferenceByHomeId(req, res, next));

export default router;
