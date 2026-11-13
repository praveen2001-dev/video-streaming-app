import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { formatDuration, formatDate } from '../utils/formatters';
import { getVideoThumbnailUrl } from '../api/videoApi';

export const VideoCard = ({ video }) => {
  const isCompleted = video.processingStatus === 'completed';
  const thumbnailUrl = isCompleted ? getVideoThumbnailUrl(video._id) : null;

  return (
    <Link to={`/watch/${video._id}`} className="video-card">
      <div className="video-card-thumb-wrapper">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="video-card-thumb"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1f1f1f',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              gap: '8px',
            }}
          >
            <span>🎬</span>
            <span>{video.processingStatus === 'processing' ? 'Transcoding...' : 'No Thumbnail'}</span>
          </div>
        )}

        {isCompleted && video.duration > 0 && (
          <span className="video-duration-badge">{formatDuration(video.duration)}</span>
        )}
      </div>

      <div className="video-card-info">
        <h3 className="video-card-title">{video.title}</h3>
        <div className="video-card-meta">
          <span>{formatDate(video.createdAt)}</span>
          {!isCompleted && <StatusBadge status={video.processingStatus} />}
        </div>
      </div>
    </Link>
  );
};
