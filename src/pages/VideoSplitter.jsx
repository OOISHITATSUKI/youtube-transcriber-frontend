import { useState, useRef } from 'react';
import { t, useLang } from '../i18n';

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function parseTime(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export default function VideoSplitter() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoName, setVideoName] = useState('');
  const [duration, setDuration] = useState(0);
  const [splits, setSplits] = useState([{ start: '00:00', end: '', label: 'Part 1' }]);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  useLang();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoName(file.name);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const handleLoadedMetadata = () => {
    const dur = videoRef.current?.duration || 0;
    setDuration(dur);
    setSplits([{ start: '00:00', end: formatTime(dur), label: 'Part 1' }]);
  };

  const addSplit = () => {
    setSplits(prev => [
      ...prev,
      { start: prev[prev.length - 1]?.end || '00:00', end: formatTime(duration), label: `Part ${prev.length + 1}` }
    ]);
  };

  const removeSplit = (i) => {
    if (splits.length <= 1) return;
    setSplits(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateSplit = (i, field, value) => {
    setSplits(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const seekTo = (timeStr) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseTime(timeStr);
    }
  };

  const handleExportClip = async (split, index) => {
    if (!videoRef.current) return;
    setProcessing(true);

    try {
      const video = videoRef.current;
      const startSec = parseTime(split.start);
      const endSec = parseTime(split.end);
      const clipDuration = endSec - startSec;

      if (clipDuration <= 0) {
        alert(t('videoSplit_endTimeError'));
        setProcessing(false);
        return;
      }

      // Use MediaRecorder to capture the video segment
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);

      // Add audio track if available
      if (video.captureStream) {
        const audioStream = video.captureStream();
        audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const baseName = videoName ? videoName.replace(/\.[^.]+$/, '') : 'video';
        a.download = `${baseName}_${split.label.replace(/\s+/g, '_')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setProcessing(false);
      };

      video.currentTime = startSec;
      await new Promise(r => video.addEventListener('seeked', r, { once: true }));

      recorder.start();
      video.play();

      const drawFrame = () => {
        if (video.currentTime >= endSec || video.paused) {
          video.pause();
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };
      drawFrame();

    } catch (err) {
      console.error('Export failed:', err);
      alert(t('videoSplit_exportError'));
      setProcessing(false);
    }
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('videoSplit_title')}</h1>
        <p>{t('videoSplit_desc')}</p>
      </div>

      {!videoUrl ? (
        <div className="file-upload-area">
          <label className="file-upload-label file-upload-large">
            <input type="file" accept="video/*" onChange={handleFile} hidden />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>{t('videoSplit_upload')}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('videoSplit_uploadFormats')}</span>
          </label>
        </div>
      ) : (
        <>
          <div className="video-preview">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {duration > 0 && (
            <div className="video-info-bar">
              <span>{videoName}</span>
              <span>{formatTime(duration)} {t('videoSplit_total')}</span>
            </div>
          )}

          <div className="splits-section">
            <div className="splits-header">
              <h2>{t('videoSplit_clips')}</h2>
              <button className="add-split-btn" onClick={addSplit}>{t('videoSplit_addClip')}</button>
            </div>

            {splits.map((split, i) => (
              <div key={i} className="split-row">
                <input
                  className="split-label-input"
                  value={split.label}
                  onChange={(e) => updateSplit(i, 'label', e.target.value)}
                  placeholder={t('videoSplit_labelPlaceholder')}
                />
                <div className="split-time-group">
                  <input
                    className="split-time-input"
                    value={split.start}
                    onChange={(e) => updateSplit(i, 'start', e.target.value)}
                    placeholder="00:00"
                    onClick={() => seekTo(split.start)}
                  />
                  <span className="split-arrow">→</span>
                  <input
                    className="split-time-input"
                    value={split.end}
                    onChange={(e) => updateSplit(i, 'end', e.target.value)}
                    placeholder={formatTime(duration)}
                    onClick={() => seekTo(split.end)}
                  />
                </div>
                <button
                  className="split-export-btn"
                  onClick={() => handleExportClip(split, i)}
                  disabled={processing}
                >
                  {processing ? '...' : t('videoSplit_exportBtn')}
                </button>
                {splits.length > 1 && (
                  <button className="split-remove-btn" onClick={() => removeSplit(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            className="copy-btn"
            onClick={() => { setVideoUrl(''); setVideoName(''); setDuration(0); setSplits([{ start: '00:00', end: '', label: 'Part 1' }]); }}
            style={{ marginTop: 16 }}
          >
            {t('videoSplit_loadDifferent')}
          </button>
        </>
      )}

      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('videoSplit_howTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('videoSplit_browserTitle')}</h3>
            <p>{t('videoSplit_browserDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('videoSplit_exportTitle')}</h3>
            <p>{t('videoSplit_exportDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
