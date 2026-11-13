import { useState, useEffect, useCallback } from 'react';
import { fetchVideos } from '../api/videoApi';

export const useVideos = (statusFilter = null) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVideos(statusFilter);
      setVideos(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return { videos, loading, error, refetch: loadVideos };
};
