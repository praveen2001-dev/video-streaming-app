import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchVideoById, getVideoStreamUrl, getVideoThumbnailUrl } from '../api/videoApi';
import { HlsPlayer } from '../components/HlsPlayer';
import { StatusBadge } from '../components/StatusBadge';
import { Loader } from '../components/Loader';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatDate } from '../utils/formatters';

export const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  const loadVideo = async () => {
    try {
      const data = await fetchVideoById(id);
      setVideo(data);

      // If video is still processing, keep polling
      if (data.processingStatus === 'pending' || data.processingStatus === 'processing') {
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(loadVideo, 3000);
        }
      } else {
        // Once completed or failed, stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading video details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideo();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <Loader message="Loading video stream..." />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container">
        <ErrorMessage message={error || 'Video not found'} onRetry={loadVideo} />
        <Link to="/" className="nav-btn" style={{ marginTop: '16px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  const isCompleted = video.processingStatus === 'completed';
  const isFailed = video.processingStatus === 'failed';
  const streamUrl = isCompleted ? getVideoStreamUrl(video._id, video.hlsPlaylist || 'master.m3u8') : null;
  const posterUrl = isCompleted ? getVideoThumbnailUrl(video._id) : null;

  return (
    <div className="container">
      <Link to="/" style={{ color: 'var(--text-secondary)', display: 'inline-block', marginBottom: '14px', fontSize: '0.9rem' }}>
        ← Back to feed
      </Link>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {isCompleted && streamUrl ? (
          <HlsPlayer src={streamUrl} poster={posterUrl} />
        ) : isFailed ? (
          <div
            style={{
              padding: '60px 20px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--status-failed)', fontSize: '1.2rem', marginBottom: '8px' }}>
              ❌ Video Transcoding Failed
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {video.errorMessage || 'An error occurred during FFmpeg HLS conversion.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '80px 20px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              Video is being processed...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              FFmpeg is currently generating HLS segments and adaptive bitrates. This page will automatically update once ready.
            </p>
          </div>
        )}

        <div className="player-details">
          <h1 className="player-title">{video.title}</h1>
          <div className="player-meta-row">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Uploaded {formatDate(video.createdAt)}
            </span>
            <StatusBadge status={video.processingStatus} />
          </div>

          {video.description && (
            <div className="player-description-box">
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Description
              </strong>
              {video.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
