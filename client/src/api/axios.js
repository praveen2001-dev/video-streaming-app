import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawUrl = rawUrl.replace(/\/+$/, '');
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'admin_secret_key_123';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': ADMIN_API_KEY,
  },
});

export default apiClient;
