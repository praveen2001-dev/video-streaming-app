import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVideos, deleteVideo } from '../api/videoApi';
import { StatusBadge } from '../components/StatusBadge';
import { Loader } from '../components/Loader';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatDuration, formatDate } from '../utils/formatters';

export const AdminManage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadVideos = async () => {
    try {
      setError(null);
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
    // Poll every 5s if any video is processing
    const interval = setInterval(() => {
      fetchVideos()
        .then((data) => setVideos(data))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will delete all HLS files and the database record.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container">
      <div className="manage-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Video Management (Admin)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Monitor real-time transcoding status and manage videos
          </p>
        </div>
        <Link to="/upload" className="nav-btn nav-btn-primary">
          + Upload Video
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadVideos} />}

      {loading ? (
        <Loader message="Loading video table..." />
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
          <p>No videos found.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video._id}>
                  <td>
                    <Link
                      to={`/watch/${video._id}`}
                      style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {video.title}
                    </Link>
                    {video.errorMessage && (
                      <div style={{ color: 'var(--status-failed)', fontSize: '0.75rem', marginTop: '4px' }}>
                        Error: {video.errorMessage}
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={video.processingStatus} />
                  </td>
                  <td>{video.duration ? formatDuration(video.duration) : '--:--'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(video.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link to={`/watch/${video._id}`} className="nav-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(video._id, video.title)}
                        className="delete-btn"
                        disabled={deletingId === video._id}
                      >
                        {deletingId === video._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
