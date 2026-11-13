import apiClient from './axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawUrl = rawUrl.replace(/\/+$/, '');
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export const fetchVideos = async (status) => {
  const params = status ? { status } : {};
  const response = await apiClient.get('/videos', { params });
  return response.data.data;
};

export const fetchVideoById = async (id) => {
  const response = await apiClient.get(`/videos/${id}`);
  return response.data.data;
};

export const uploadVideo = async (formData, onUploadProgress) => {
  const response = await apiClient.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const deleteVideo = async (id) => {
  const response = await apiClient.delete(`/videos/${id}`);
  return response.data;
};

export const getVideoStreamUrl = (id, filename = 'master.m3u8') => {
  return `${API_BASE_URL}/videos/stream/${id}/${filename}`;
};

export const getVideoThumbnailUrl = (id) => {
  return `${API_BASE_URL}/videos/${id}/thumbnail`;
};
