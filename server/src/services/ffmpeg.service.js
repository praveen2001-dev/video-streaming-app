import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

// Setup FFmpeg and FFprobe paths
const initFfmpeg = async () => {
  if (env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(env.FFMPEG_PATH);
  } else {
    try {
      const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
      if (ffmpegInstaller.default?.path) {
        ffmpeg.setFfmpegPath(ffmpegInstaller.default.path);
      }
    } catch {
      // Fallback to system ffmpeg in PATH
    }
  }

  if (env.FFPROBE_PATH) {
    ffmpeg.setFfprobePath(env.FFPROBE_PATH);
  } else {
    try {
      const ffprobeInstaller = await import('@ffprobe-installer/ffprobe');
      if (ffprobeInstaller.default?.path) {
        ffmpeg.setFfprobePath(ffprobeInstaller.default.path);
      }
    } catch {
      // Fallback to system ffprobe in PATH
    }
  }
};

initFfmpeg();

/**
 * Extract metadata (duration, width, height) using ffprobe
 */
export const getVideoMetadata = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const duration = metadata.format.duration ? Math.round(metadata.format.duration) : 0;
      const width = videoStream ? videoStream.width : 1280;
      const height = videoStream ? videoStream.height : 720;

      resolve({
        duration,
        width,
        height,
        format: metadata.format.format_name,
        bitrate: metadata.format.bit_rate,
      });
    });
  });
};

/**
 * Generate thumbnail image (thumbnail.jpg)
 */
export const generateThumbnail = (inputPath, outputDir, duration = 10) => {
  return new Promise((resolve, reject) => {
    const timestamp = duration > 2 ? Math.min(2, Math.floor(duration / 2)) : 0;

    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: 'thumbnail.jpg',
        folder: outputDir,
        size: '640x360',
      })
      .on('end', () => {
        resolve('thumbnail.jpg');
      })
      .on('error', (err) => {
        console.error('[FFmpeg Thumbnail Error]:', err.message);
        reject(err);
      });
  });
};

/**
 * Helper to encode one HLS rendition
 */
const encodeRendition = (inputPath, outputDir, rendition) => {
  return new Promise((resolve, reject) => {
    const playlistFile = `${rendition.name}.m3u8`;
    const segmentPattern = path.join(outputDir, `${rendition.name}_%03d.ts`);
    const playlistPath = path.join(outputDir, playlistFile);

    ffmpeg(inputPath)
      .outputOptions([
        `-vf scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease`,
        '-c:v libx264',
        '-profile:v main',
        '-crf 22',
        '-preset fast',
        `-b:v ${rendition.videoBitrate}`,
        `-maxrate ${rendition.maxrate}`,
        `-bufsize ${rendition.bufsize}`,
        '-c:a aac',
        `-b:a ${rendition.audioBitrate}`,
        '-ac 2',
        '-ar 44100',
        '-hls_time 4',
        '-hls_playlist_type vod',
        '-hls_segment_filename', segmentPattern,
      ])
      .output(playlistPath)
      .on('end', () => resolve(rendition))
      .on('error', (err) => {
        console.error(`[FFmpeg Error on ${rendition.name}]:`, err.message);
        reject(err);
      })
      .run();
  });
};

/**
 * Convert input MP4 to multi-variant HLS (360p / 720p) with master playlist
 */
export const convertToHLS = async (inputPath, outputDir, metadata) => {
  const renditions = [
    {
      name: '360p',
      width: 640,
      height: 360,
      videoBitrate: '800k',
      maxrate: '900k',
      bufsize: '1200k',
      audioBitrate: '96k',
      bandwidth: 896000,
    },
  ];

  // If source resolution is high enough (>= 480p), add 720p rendition
  if (metadata.height >= 480 || metadata.width >= 854) {
    renditions.push({
      name: '720p',
      width: 1280,
      height: 720,
      videoBitrate: '2400k',
      maxrate: '2600k',
      bufsize: '3600k',
      audioBitrate: '128k',
      bandwidth: 2528000,
    });
  }

  // Transcode each rendition
  for (const rendition of renditions) {
    await encodeRendition(inputPath, outputDir, rendition);
  }

  // Generate master playlist (master.m3u8)
  let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
  for (const r of renditions) {
    masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.width}x${r.height},NAME="${r.name}"\n`;
    masterContent += `${r.name}.m3u8\n`;
  }

  const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
  await fs.promises.writeFile(masterPlaylistPath, masterContent, 'utf-8');

  return 'master.m3u8';
};
