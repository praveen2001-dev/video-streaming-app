import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

// Top-level initialization of FFmpeg & FFprobe paths
if (env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(env.FFMPEG_PATH);
} else {
  try {
    const ffmpegModule = await import('@ffmpeg-installer/ffmpeg');
    const ffmpegPath = ffmpegModule.default?.path || ffmpegModule.path;
    if (ffmpegPath) {
      try {
        fs.chmodSync(ffmpegPath, 0o755);
      } catch {}
      ffmpeg.setFfmpegPath(ffmpegPath);
      console.log(`[FFmpeg] Using bundled binary at: ${ffmpegPath}`);
    }
  } catch (err) {
    console.warn('[FFmpeg] Bundled installer not found, using system ffmpeg');
  }
}

if (env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(env.FFPROBE_PATH);
} else {
  try {
    const ffprobeModule = await import('@ffprobe-installer/ffprobe');
    const ffprobePath = ffprobeModule.default?.path || ffprobeModule.path;
    if (ffprobePath) {
      try {
        fs.chmodSync(ffprobePath, 0o755);
      } catch {}
      ffmpeg.setFfprobePath(ffprobePath);
      console.log(`[FFprobe] Using bundled binary at: ${ffprobePath}`);
    }
  } catch (err) {
    console.warn('[FFprobe] Bundled installer not found, using system ffprobe');
  }
}

/**
 * Extract metadata (duration, width, height, hasAudio)
 */
export const getVideoMetadata = (inputPath) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[FFprobe] Timeout reached, proceeding with defaults');
      resolve({ duration: 10, width: 1280, height: 720, hasAudio: true });
    }, 8000);

    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      clearTimeout(timeout);
      if (err) {
        console.warn('[FFprobe Warning]: Could not probe metadata, using defaults:', err.message);
        return resolve({ duration: 10, width: 1280, height: 720, hasAudio: true });
      }

      const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams?.find((s) => s.codec_type === 'audio');
      const duration = metadata.format?.duration ? Math.round(metadata.format.duration) : 10;
      const width = videoStream?.width || 1280;
      const height = videoStream?.height || 720;
      const hasAudio = !!audioStream;

      resolve({
        duration,
        width,
        height,
        hasAudio,
      });
    });
  });
};

/**
 * Generate thumbnail image (thumbnail.jpg) with safe timeout fallback
 */
export const generateThumbnail = (inputPath, outputDir) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[FFmpeg Thumbnail] Timeout, skipping thumbnail');
      resolve(null);
    }, 10000);

    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: 'thumbnail.jpg',
        folder: outputDir,
        size: '640x360',
      })
      .on('end', () => {
        clearTimeout(timeout);
        resolve('thumbnail.jpg');
      })
      .on('error', (err) => {
        clearTimeout(timeout);
        console.warn('[FFmpeg Thumbnail Warning]:', err.message);
        resolve(null); // Don't fail the entire job if thumbnail generation fails
      });
  });
};

/**
 * Universal Mobile & Desktop HLS Transcoding
 * Fixes mobile phone camera videos (odd dimensions like 1079x1920, yuv420p format, orientation)
 */
export const convertToHLS = (inputPath, outputDir, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const playlistFile = 'master.m3u8';
    const segmentPattern = path.join(outputDir, 'segment_%03d.ts');
    const playlistPath = path.join(outputDir, playlistFile);

    console.log(`[FFmpeg] Starting universal HLS transcoding for ${inputPath}`);

    // Essential fix for phone videos:
    // 1. scale=trunc(iw/2)*2:trunc(ih/2)*2 forces dimensions to be even numbers (required by H.264)
    // 2. format=yuv420p ensures 8-bit standard color readable by all browsers
    const outputOptions = [
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-tune',
      'zerolatency',
      '-crf',
      '26',
      '-hls_time',
      '4',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      segmentPattern,
    ];

    // Only add audio encoding if source video actually contains an audio stream
    if (metadata.hasAudio !== false) {
      outputOptions.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
    }

    ffmpeg(inputPath)
      .outputOptions(outputOptions)
      .output(playlistPath)
      .on('start', (cmd) => {
        console.log('[FFmpeg Command Line]:', cmd);
      })
      .on('end', () => {
        console.log('[FFmpeg] Universal HLS conversion finished successfully.');
        resolve(playlistFile);
      })
      .on('error', (err) => {
        console.error('[FFmpeg Error]:', err.message);
        reject(err);
      })
      .run();
  });
};
