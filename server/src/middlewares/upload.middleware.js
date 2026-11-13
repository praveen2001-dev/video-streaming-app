import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../storage/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.mp4'];
  const allowedMimes = ['video/mp4'];

  if (allowedExts.includes(ext) && (allowedMimes.includes(file.mimetype) || file.mimetype === 'application/octet-stream')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only MP4 video files (.mp4) are allowed'));
  }
};

export const uploadVideoFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});
