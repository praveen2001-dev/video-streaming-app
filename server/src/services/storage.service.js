import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BASE_STORAGE_DIR = path.resolve(__dirname, '../../storage');
export const UPLOADS_DIR = path.join(BASE_STORAGE_DIR, 'uploads');
export const PROCESSED_DIR = path.join(BASE_STORAGE_DIR, 'processed');

export const ensureStorageDirectories = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }
};

export const getVideoProcessedDir = (videoId) => {
  const targetDir = path.resolve(PROCESSED_DIR, String(videoId));
  // Security: check path traversal
  if (!targetDir.startsWith(PROCESSED_DIR)) {
    throw new ApiError(400, 'Security violation: Invalid storage path traversal');
  }
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

export const getSafeFilePath = (videoId, requestedSubPath) => {
  const videoDir = path.resolve(PROCESSED_DIR, String(videoId));
  const safeTarget = path.resolve(videoDir, requestedSubPath);

  // Guard against directory traversal attacks like ../../etc/passwd
  if (!safeTarget.startsWith(videoDir)) {
    throw new ApiError(403, 'Forbidden: Path traversal is not permitted');
  }

  if (!fs.existsSync(safeTarget)) {
    throw new ApiError(404, 'Stream resource not found');
  }

  return safeTarget;
};

export const removeFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`[StorageService] Failed to delete file ${filePath}:`, err.message);
  }
};

export const removeVideoDirectory = async (videoId) => {
  try {
    const videoDir = path.resolve(PROCESSED_DIR, String(videoId));
    if (videoDir.startsWith(PROCESSED_DIR) && fs.existsSync(videoDir)) {
      await fs.promises.rm(videoDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[StorageService] Failed to delete folder for video ${videoId}:`, err.message);
  }
};
