import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export const HlsPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setErrorMsg(null);

    // 1. Try HLS.js if supported
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualityLevels = data.levels.map((lvl, index) => ({
          index,
          height: lvl.height,
          bitrate: lvl.bitrate,
          name: lvl.name || `${lvl.height}p`,
        }));
        setLevels(qualityLevels);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        // level switched callback
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Network error encountered, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Media error encountered, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Fatal error, destroying player instance:', data);
              setErrorMsg('Playback error: Unable to load video stream.');
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }
    // 2. Native Safari fallback
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      setErrorMsg('Your browser does not support HLS video playback.');
    }
  }, [src]);

  const handleQualityChange = (e) => {
    const levelIdx = parseInt(e.target.value, 10);
    setCurrentLevel(levelIdx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx;
    }
  };

  return (
    <div className="player-container">
      <div className="player-video-box">
        <video
          ref={videoRef}
          className="player-video-element"
          controls
          playsInline
          poster={poster}
        />
      </div>

      <div className="player-controls-bar">
        {levels.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="quality" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Quality:
            </label>
            <select
              id="quality"
              className="quality-select"
              value={currentLevel}
              onChange={handleQualityChange}
            >
              <option value="-1">Auto</option>
              {levels.map((lvl) => (
                <option key={lvl.index} value={lvl.index}>
                  {lvl.name || `${lvl.height}p`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ marginTop: '12px', color: 'var(--status-failed)', fontSize: '0.9rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
};
