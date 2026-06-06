import { Router } from 'express';
import { getPmBundles, getPmBundleDetail, getPmModels } from '../controllers/pm-bundles.controller';

const router = Router();
router.get('/models', getPmModels);      // GET /api/v1/pm-bundles/models
router.get('/', getPmBundles);           // GET /api/v1/pm-bundles?unit_model=SKT90S
router.get('/:id', getPmBundleDetail);   // GET /api/v1/pm-bundles/1
export default router;
