import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    originalFile: {
      originalName: { type: String, required: true },
      filename: { type: String, required: true },
      path: { type: String, required: true },
      size: { type: Number, required: true },
      mimetype: { type: String, required: true },
    },
    hlsPlaylist: {
      type: String,
      default: null, // e.g. "master.m3u8" relative to video folder
    },
    thumbnail: {
      type: String,
      default: null, // e.g. "thumbnail.jpg" relative to video folder
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    duration: {
      type: Number,
      default: 0, // duration in seconds
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Video = mongoose.model('Video', videoSchema);
