import { useState, useRef, useCallback } from 'react';
import { t, useLang } from '../i18n';

export default function BgRemoverPage() {
  useLang();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const canvasRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > 20 * 1024 * 1024) {
      setError(t('bgrem_fileTooLarge'));
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleRemove = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    setError('');
    setResult(null);

    try {
      setProgress(20);
      // Dynamic import to avoid loading 40MB+ on page load
      const { removeBackground } = await import('@imgly/background-removal');
      setProgress(40);

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          // Map model loading + inference to 40-95%
          if (total > 0) {
            const pct = 40 + Math.round((current / total) * 55);
            setProgress(Math.min(pct, 95));
          }
        },
      });

      setProgress(100);
      const url = URL.createObjectURL(blob);
      setResult({ url, blob, name: file.name.replace(/\.[^.]+$/, '') + '_nobg.png' });
    } catch (err) {
      console.error('Background removal error:', err);
      setError(err.message || t('bgrem_error'));
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.name;
    a.click();
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setProgress(0);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('bgrem_title')}</h1>
        <p>{t('bgrem_desc')}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
          {t('bgrem_privacy')}
        </p>
      </div>

      {!result ? (
        <>
          {/* Upload Area */}
          {!file && (
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="upload-text">{t('bgrem_dropText')}</p>
              <label className="upload-select-btn">
                {t('bgrem_selectFile')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/bmp"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  hidden
                />
              </label>
              <p className="upload-formats-text">
                JPG, PNG, WebP, BMP（{t('bgrem_maxSize')}）
              </p>
            </div>
          )}

          {/* Preview */}
          {file && !processing && (
            <>
              <div className="bgrem-preview">
                <img src={preview} alt="Preview" />
                <div className="bgrem-preview-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatSize(file.size)}</span>
                </div>
                <button className="file-remove" onClick={handleReset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <button
                className="convert-btn"
                onClick={handleRemove}
                style={{ width: '100%', marginTop: 16 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3l14 18"/>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                {t('bgrem_removeBtn')}
              </button>
            </>
          )}

          {/* Processing */}
          {processing && (
            <div className="bgrem-processing">
              <div className="loading-spinner" />
              <p>{t('bgrem_processing')}</p>
              <div className="bgrem-progress-bar">
                <div className="bgrem-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="bgrem-progress-text">{progress}%</p>
              {progress < 40 && (
                <p className="bgrem-progress-note">{t('bgrem_loadingModel')}</p>
              )}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </>
      ) : (
        <>
          {/* Result */}
          <div className="bgrem-result">
            <div className="bgrem-compare">
              <div className="bgrem-compare-item">
                <h3>{t('bgrem_original')}</h3>
                <div className="bgrem-image-wrap">
                  <img src={preview} alt="Original" />
                </div>
              </div>
              <div className="bgrem-compare-item">
                <h3>{t('bgrem_result')}</h3>
                <div className="bgrem-image-wrap bgrem-checkerboard">
                  <img src={result.url} alt="Result" />
                </div>
              </div>
            </div>

            <button
              className="convert-btn"
              onClick={handleDownload}
              style={{ width: '100%', marginTop: 16 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {t('bgrem_downloadPng')}
            </button>

            <button className="copy-btn" onClick={handleReset} style={{ marginTop: 12, width: '100%' }}>
              {t('bgrem_tryAnother')}
            </button>
          </div>
        </>
      )}

      {/* Info */}
      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('bgrem_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('bgrem_about1Title')}</h3>
            <p>{t('bgrem_about1Desc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('bgrem_about2Title')}</h3>
            <p>{t('bgrem_about2Desc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('bgrem_about3Title')}</h3>
            <p>{t('bgrem_about3Desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
