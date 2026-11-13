import { Router } from 'express';
import videoRoutes from './video.routes.js';

const router = Router();

router.use('/videos', videoRoutes);

export default router;
