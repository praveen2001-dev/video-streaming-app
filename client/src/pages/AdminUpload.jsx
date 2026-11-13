import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo } from '../api/videoApi';
import { ErrorMessage } from '../components/ErrorMessage';

export const AdminUpload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.includes('mp4') && !selectedFile.name.endsWith('.mp4')) {
        setError('Only MP4 videos are supported.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      if (!title) {
        // Auto-fill title from filename without extension
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an MP4 video file.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for the video.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      const res = await uploadVideo(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });

      setSuccessInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div className="upload-card">
        <h2>Upload Video (Admin)</h2>

        {error && <ErrorMessage message={error} />}

        {successInfo ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <span style={{ fontSize: '2.5rem' }}>🎉</span>
            <h3 style={{ margin: '16px 0 8px', color: 'var(--status-completed)' }}>
              Upload Successful!
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Your video was uploaded and FFmpeg HLS processing has started in the background.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate(`/watch/${successInfo._id}`)}
                className="nav-btn nav-btn-primary"
              >
                Watch Video
              </button>
              <button onClick={() => navigate('/manage')} className="nav-btn">
                Admin Manage
              </button>
              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setFile(null);
                  setTitle('');
                  setDescription('');
                  setProgress(0);
                }}
                className="nav-btn"
              >
                Upload Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Video File (MP4 only)</label>
              <div
                className="dropzone"
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="video/mp4"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {file ? (
                  <div>
                    <span style={{ fontSize: '1.8rem' }}>📁</span>
                    <p style={{ fontWeight: 600, marginTop: '8px' }}>{file.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '1.8rem' }}>📤</span>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                      Click to choose an MP4 video file
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                className="form-input"
                placeholder="Give your video a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="desc">Description</label>
              <textarea
                id="desc"
                rows="4"
                className="form-textarea"
                placeholder="Tell viewers what your video is about"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="progress-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Uploading to server...</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? `Uploading (${progress}%)...` : 'Upload & Start Transcoding'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
