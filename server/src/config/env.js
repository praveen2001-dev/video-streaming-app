import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/video_streaming',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'admin_secret_key_123',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024, // 100MB
  FFMPEG_PATH: process.env.FFMPEG_PATH || '',
  FFPROBE_PATH: process.env.FFPROBE_PATH || '',
};
