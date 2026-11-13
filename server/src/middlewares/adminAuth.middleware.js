import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const adminAuth = (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  let providedKey = apiKeyHeader;
  if (!providedKey && authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.split(' ')[1];
  }

  if (!providedKey || providedKey !== env.ADMIN_API_KEY) {
    throw new ApiError(401, 'Unauthorized: Invalid or missing Admin API Key');
  }

  next();
};
