import { Router } from 'express';
import {
  uploadVideo,
  getVideos,
  getVideo,
  deleteVideo,
  streamVideo,
  getThumbnail,
} from '../controllers/video.controller.js';
import { uploadVideoFile } from '../middlewares/upload.middleware.js';
import { adminAuth } from '../middlewares/adminAuth.middleware.js';

const router = Router();

// Public routes
router.get('/', getVideos);
router.get('/:id', getVideo);
router.get('/:id/thumbnail', getThumbnail);
router.get('/stream/:id/*', streamVideo);

// Protected Admin routes
router.post('/upload', adminAuth, uploadVideoFile.single('video'), uploadVideo);
router.delete('/:id', adminAuth, deleteVideo);

export default router;
