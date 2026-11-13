import React from 'react';
import { Link } from 'react-router-dom';
import { useVideos } from '../hooks/useVideos';
import { VideoCard } from '../components/VideoCard';
import { Loader } from '../components/Loader';
import { ErrorMessage } from '../components/ErrorMessage';

export const Home = () => {
  const { videos, loading, error, refetch } = useVideos();

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Recommended Videos</h1>
        <button onClick={refetch} className="nav-btn" style={{ fontSize: '0.85rem' }}>
          🔄 Refresh
        </button>
      </div>

      {loading && <Loader message="Fetching video catalog..." />}

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && videos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '16px' }}>No videos uploaded yet!</p>
          <Link to="/upload" className="nav-btn nav-btn-primary">
            Upload Your First Video
          </Link>
        </div>
      )}

      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
};
