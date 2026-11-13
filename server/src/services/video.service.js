import { Video } from '../models/Video.js';
import { ApiError } from '../utils/ApiError.js';
import { getVideoMetadata, generateThumbnail, convertToHLS } from './ffmpeg.service.js';
import { getVideoProcessedDir, removeFile, removeVideoDirectory } from './storage.service.js';

export const createPendingVideo = async ({ title, description, file }) => {
  const video = await Video.create({
    title,
    description: description || '',
    originalFile: {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    },
    processingStatus: 'pending',
  });

  // Launch background FFmpeg processing (fire-and-forget, non-blocking)
  processVideoJob(video._id, file.path).catch((err) => {
    console.error(`[Background Processing Failed for ${video._id}]:`, err.message);
  });

  return video;
};

export const processVideoJob = async (videoId, originalFilePath) => {
  try {
    console.log(`[Processing Started] Video ID: ${videoId}`);
    await Video.findByIdAndUpdate(videoId, { processingStatus: 'processing', errorMessage: null });

    const processedDir = getVideoProcessedDir(videoId);

    // 1. Probe video metadata (fast, with fallback)
    const metadata = await getVideoMetadata(originalFilePath);

    // 2. Generate thumbnail (safe fallback if it fails)
    const thumbFile = await generateThumbnail(originalFilePath, processedDir);

    // 3. Transcode to HLS using universal mobile & desktop settings
    const masterPlaylist = await convertToHLS(originalFilePath, processedDir, metadata);

    // 4. Update MongoDB document as completed
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        processingStatus: 'completed',
        duration: metadata.duration || 0,
        hlsPlaylist: masterPlaylist,
        thumbnail: thumbFile || null,
        errorMessage: null,
      },
      { new: true }
    );

    console.log(`[Processing Completed] Video ID: ${videoId} ready for playback.`);

    // 5. Clean up temporary uploaded MP4 file
    await removeFile(originalFilePath);

    return updatedVideo;
  } catch (error) {
    console.error(`[Processing Error for Video ${videoId}]:`, error);

    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      errorMessage: error.message || 'Video processing failed',
    });

    // Cleanup on failure
    await removeFile(originalFilePath);
    await removeVideoDirectory(videoId);
  }
};

export const getAllVideos = async (filter = {}) => {
  return Video.find(filter).sort({ createdAt: -1 });
};

export const getVideoById = async (videoId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }
  return video;
};

export const deleteVideoById = async (videoId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  // Remove files
  if (video.originalFile?.path) {
    await removeFile(video.originalFile.path);
  }
  await removeVideoDirectory(videoId);

  // Remove DB record
  await Video.findByIdAndDelete(videoId);

  return { message: 'Video deleted successfully', videoId };
};
