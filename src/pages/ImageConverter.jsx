import { useState, useRef } from 'react';
import { t, useLang } from '../i18n';

const DAILY_FREE_LIMIT = 10;
const STORAGE_KEY = 'imgconv_daily';

function getDailyCount() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return 0;
  const { date, count } = JSON.parse(saved);
  if (date !== new Date().toISOString().slice(0, 10)) return 0;
  return count;
}

function addDailyCount(n) {
  const today = new Date().toISOString().slice(0, 10);
  const current = getDailyCount();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: current + n }));
}

const OUTPUT_FORMATS = [
  { id: 'webp', label: 'WebP', mime: 'image/webp', ext: '.webp' },
  { id: 'jpeg', label: 'JPG', mime: 'image/jpeg', ext: '.jpg' },
  { id: 'png', label: 'PNG', mime: 'image/png', ext: '.png' },
];

export default function ImageConverter() {
  useLang();
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [quality, setQuality] = useState(85);
  const [outputFormat, setOutputFormat] = useState('webp');
  const [processing, setProcessing] = useState(false);
  const [dailyCount, setDailyCount] = useState(getDailyCount());
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const MAX_FILES = 10;
  const remaining = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = remaining <= 0;
  const selectedFormat = OUTPUT_FORMATS.find(f => f.id === outputFormat);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, MAX_FILES);
    setFiles(selected);
    setConverted([]);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, MAX_FILES);
    setFiles(dropped);
    setConverted([]);
    setError('');
  };

  const convertOne = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) { reject(new Error('Canvas not available')); return; }
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          // PNG needs transparent background support
          if (outputFormat === 'png') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          const qualityValue = outputFormat === 'png' ? undefined : quality / 100;

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (!blob) { reject(new Error('Conversion failed')); return; }
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const pct = Math.round((1 - blob.size / file.size) * 100);
            resolve({
              name: `${baseName}${selectedFormat.ext}`,
              blob,
              originalSize: file.size,
              newSize: blob.size,
              pct,
              url: URL.createObjectURL(blob),
            });
          }, selectedFormat.mime, qualityValue);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0 || isLimitReached) return;
    const allowedCount = Math.min(files.length, remaining);
    const filesToConvert = files.slice(0, allowedCount);
    setProcessing(true);
    setError('');
    const results = [];
    for (const file of filesToConvert) {
      try {
        const result = await convertOne(file);
        results.push(result);
      } catch (e) {
        setError(`${file.name}: ${e.message}`);
      }
    }
    if (results.length > 0) {
      addDailyCount(results.length);
      setDailyCount(getDailyCount());
      setConverted(results);
    }
    setProcessing(false);
  };

  const handleDownload = (item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    a.click();
  };

  const handleDownloadAll = () => {
    converted.forEach((item, i) => {
      setTimeout(() => handleDownload(item), i * 150);
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSaved = converted.reduce((a, c) => a + (c.originalSize - c.newSize), 0);

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('imgconv_title')}</h1>
        <p>{t('imgconv_desc')}</p>
        {!isLimitReached && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
            {remaining}/{DAILY_FREE_LIMIT} free today
          </p>
        )}
      </div>

      {/* Output Format Selector */}
      <div className="format-selector">
        <label className="format-label">{t('imgconv_outputFormat')}</label>
        <div className="format-options">
          {OUTPUT_FORMATS.map(fmt => (
            <button
              key={fmt.id}
              className={`format-option ${outputFormat === fmt.id ? 'active' : ''}`}
              onClick={() => { setOutputFormat(fmt.id); setConverted([]); }}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {isLimitReached ? (
        <div className="webp-limit-banner">
          <div className="lock-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3>{t('webp_limitReached')}</h3>
          <p>{t('webp_limitDesc')}</p>
        </div>
      ) : (
        <div
          className="file-upload-area"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <label className="file-upload-label file-upload-large">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif" multiple onChange={handleFiles} hidden />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{files.length > 0 ? t('imgconv_filesSelected', { count: files.length }) : t('imgconv_upload')}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('imgconv_formats')}</span>
          </label>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {files.length > 0 && !converted.length && !isLimitReached && (
        <div className="webp-controls">
          {outputFormat !== 'png' && (
            <div className="quality-slider">
              <label>{t('imgconv_quality')}: <strong>{quality}%</strong></label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <div className="quality-hints">
                <span>{t('webp_smaller')}</span>
                <span>{t('webp_sharper')}</span>
              </div>
            </div>
          )}
          <button className="convert-btn" onClick={handleConvert} disabled={processing} style={{ width: '100%', marginTop: 16 }}>
            {processing ? t('imgconv_converting') : t('imgconv_convertBtn', { count: files.length, format: selectedFormat.label })}
          </button>
        </div>
      )}

      {converted.length > 0 && (
        <div className="webp-results">
          <div className="webp-summary">
            <span>{t('imgconv_converted', { count: converted.length, format: selectedFormat.label })}</span>
            {totalSaved > 0 && <span className="webp-saved">{t('webp_totalSaved', { size: formatSize(totalSaved) })}</span>}
          </div>

          <div className="webp-list">
            {converted.map((item, i) => (
              <div key={i} className="webp-item">
                <div className="webp-item-preview">
                  <img src={item.url} alt={item.name} />
                </div>
                <div className="webp-item-info">
                  <span className="webp-item-name">{item.name}</span>
                  <span className="webp-item-sizes">
                    {formatSize(item.originalSize)} → {formatSize(item.newSize)}
                    <span className={`webp-item-pct ${item.pct > 0 ? 'positive' : ''}`}>
                      {item.pct > 0 ? `-${item.pct}%` : `+${Math.abs(item.pct)}%`}
                    </span>
                  </span>
                </div>
                <button className="copy-btn" onClick={() => handleDownload(item)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  {selectedFormat.ext}
                </button>
              </div>
            ))}
          </div>

          {converted.length > 1 && (
            <button className="convert-btn" onClick={handleDownloadAll} style={{ width: '100%', marginTop: 12 }}>
              {t('webp_downloadAll')}
            </button>
          )}

          <button
            className="copy-btn"
            onClick={() => { setFiles([]); setConverted([]); }}
            style={{ marginTop: 12 }}
          >
            {t('imgconv_convertMore')}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('imgconv_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>WebP</h3>
            <p>{t('imgconv_aboutWebp')}</p>
          </div>
          <div className="info-card">
            <h3>JPG</h3>
            <p>{t('imgconv_aboutJpg')}</p>
          </div>
          <div className="info-card">
            <h3>PNG</h3>
            <p>{t('imgconv_aboutPng')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
