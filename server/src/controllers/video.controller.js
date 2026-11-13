import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createPendingVideo,
  getAllVideos,
  getVideoById,
  deleteVideoById,
} from '../services/video.service.js';
import { getSafeFilePath, PROCESSED_DIR } from '../services/storage.service.js';

/**
 * Upload Video (Admin only)
 * Responds immediately with 202 Accepted while processing happens in background
 */
export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select an MP4 video file to upload');
  }

  const { title, description } = req.body;
  if (!title || !title.trim()) {
    throw new ApiError(400, 'Video title is required');
  }

  const video = await createPendingVideo({
    title: title.trim(),
    description: description ? description.trim() : '',
    file: req.file,
  });

  res.status(202).json({
    success: true,
    message: 'Video upload received and processing started in background',
    data: video,
  });
});

/**
 * Get all videos (Home feed / admin management)
 */
export const getVideos = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { processingStatus: status } : {};
  const videos = await getAllVideos(filter);

  res.status(200).json({
    success: true,
    count: videos.length,
    data: videos,
  });
});

/**
 * Get single video details
 */
export const getVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await getVideoById(id);

  res.status(200).json({
    success: true,
    data: video,
  });
});

/**
 * Delete video and all associated HLS/temp files (Admin only)
 */
export const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteVideoById(id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Stream HLS playlists (.m3u8) and segments (.ts)
 * Route: GET /api/videos/stream/:id/*
 */
export const streamVideo = (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedFile = req.params[0] || 'master.m3u8';

    const safeFilePath = getSafeFilePath(id, requestedFile);
    const ext = path.extname(requestedFile).toLowerCase();

    // Set standard streaming MIME types
    if (ext === '.m3u8') {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
    } else if (ext === '.ts') {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    const stream = fs.createReadStream(safeFilePath);
    stream.on('error', (err) => next(err));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get video thumbnail
 * Route: GET /api/videos/:id/thumbnail
 */
export const getThumbnail = (req, res, next) => {
  try {
    const { id } = req.params;
    const thumbnailPath = getSafeFilePath(id, 'thumbnail.jpg');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    fs.createReadStream(thumbnailPath).pipe(res);
  } catch (error) {
    next(error);
  }
};
