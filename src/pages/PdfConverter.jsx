import { useState, useRef } from 'react';
import { t, useLang } from '../i18n';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

const DAILY_FREE_LIMIT = 10;
const STORAGE_KEY = 'pdfconv_daily';

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

const IMAGE_FORMATS = [
  { id: 'jpeg', label: 'JPG', mime: 'image/jpeg', ext: '.jpg' },
  { id: 'png', label: 'PNG', mime: 'image/png', ext: '.png' },
  { id: 'webp', label: 'WebP', mime: 'image/webp', ext: '.webp' },
];

const MAX_FILES = 10;

export default function PdfConverter() {
  useLang();
  const [mode, setMode] = useState('img2pdf'); // 'img2pdf' | 'pdf2img'
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [dailyCount, setDailyCount] = useState(getDailyCount());
  const canvasRef = useRef(null);

  const remaining = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = remaining <= 0;
  const selectedFormat = IMAGE_FORMATS.find(f => f.id === outputFormat);

  const resetState = () => {
    setFiles([]);
    setConverted([]);
    setError('');
    setProgress('');
  };

  const handleModeChange = (m) => {
    setMode(m);
    resetState();
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, MAX_FILES);
    setFiles(selected);
    setConverted([]);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const filtered = mode === 'img2pdf'
      ? dropped.filter(f => f.type.startsWith('image/'))
      : dropped.filter(f => f.type === 'application/pdf');
    setFiles(filtered.slice(0, MAX_FILES));
    setConverted([]);
    setError('');
  };

  // ─── Image → PDF ───

  const loadImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
      img.src = url;
    });
  };

  const convertImagesToPdf = async () => {
    if (files.length === 0 || isLimitReached) return;
    setProcessing(true);
    setError('');
    setProgress(t('pdfconv_processing'));

    try {
      // Load first image to determine initial page size
      const firstImg = await loadImage(files[0]);
      const pdf = new jsPDF({
        orientation: firstImg.naturalWidth > firstImg.naturalHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [firstImg.naturalWidth, firstImg.naturalHeight],
      });
      pdf.addImage(firstImg, 'JPEG', 0, 0, firstImg.naturalWidth, firstImg.naturalHeight);

      for (let i = 1; i < files.length; i++) {
        setProgress(t('pdfconv_processingPage', { current: i + 1, total: files.length }));
        const img = await loadImage(files[i]);
        pdf.addPage([img.naturalWidth, img.naturalHeight],
          img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, img.naturalWidth, img.naturalHeight);
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const totalOriginal = files.reduce((sum, f) => sum + f.size, 0);

      addDailyCount(1);
      setDailyCount(getDailyCount());
      setConverted([{
        name: files.length === 1
          ? files[0].name.replace(/\.[^.]+$/, '') + '.pdf'
          : 'combined.pdf',
        blob,
        url,
        originalSize: totalOriginal,
        newSize: blob.size,
        pages: files.length,
      }]);
    } catch (e) {
      setError(e.message);
    }
    setProcessing(false);
    setProgress('');
  };

  // ─── PDF → Image ───

  const convertPdfToImages = async () => {
    if (files.length === 0 || isLimitReached) return;
    setProcessing(true);
    setError('');
    const results = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const baseName = file.name.replace(/\.pdf$/i, '');

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setProgress(t('pdfconv_processingPage', {
            current: results.length + 1,
            total: `${baseName} ${pageNum}/${totalPages}`,
          }));

          const page = await pdf.getPage(pageNum);
          const scale = 2; // 2x for good quality
          const viewport = page.getViewport({ scale });

          const canvas = canvasRef.current;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (outputFormat === 'png') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          await page.render({ canvasContext: ctx, viewport }).promise;

          const qualityValue = outputFormat === 'png' ? undefined : quality / 100;
          const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, selectedFormat.mime, qualityValue);
          });

          if (blob) {
            const pageSuffix = totalPages > 1 ? `_p${pageNum}` : '';
            results.push({
              name: `${baseName}${pageSuffix}${selectedFormat.ext}`,
              blob,
              url: URL.createObjectURL(blob),
              originalSize: file.size,
              newSize: blob.size,
              pageNum,
            });
          }
        }
      } catch (e) {
        setError(`${file.name}: ${e.message}`);
      }
    }

    if (results.length > 0) {
      addDailyCount(1);
      setDailyCount(getDailyCount());
    }
    setConverted(results);
    setProcessing(false);
    setProgress('');
  };

  const handleConvert = () => {
    if (mode === 'img2pdf') convertImagesToPdf();
    else convertPdfToImages();
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

  const acceptTypes = mode === 'img2pdf'
    ? 'image/jpeg,image/png,image/webp'
    : 'application/pdf';

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('pdfconv_title')}</h1>
        <p>{t('pdfconv_desc')}</p>
        {!isLimitReached && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
            {remaining}/{DAILY_FREE_LIMIT} free today
          </p>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'img2pdf' ? 'active' : ''}`}
          onClick={() => handleModeChange('img2pdf')}
        >
          {t('pdfconv_imgToPdf')}
        </button>
        <button
          className={`mode-btn ${mode === 'pdf2img' ? 'active' : ''}`}
          onClick={() => handleModeChange('pdf2img')}
        >
          {t('pdfconv_pdfToImg')}
        </button>
      </div>

      {/* Output Format (PDF → Image mode only) */}
      {mode === 'pdf2img' && (
        <div className="format-selector">
          <label className="format-label">{t('imgconv_outputFormat')}</label>
          <div className="format-options">
            {IMAGE_FORMATS.map(fmt => (
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
      )}

      {/* File Upload */}
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
          <a
            href={import.meta.env.VITE_STRIPE_PAYMENT_LINK || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="purchase-btn"
            style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: 16 }}
          >
            {t('webp_unlockBtn')}
          </a>
        </div>
      ) : (
      <div
        className="file-upload-area"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="file-upload-label file-upload-large">
          <input
            type="file"
            accept={acceptTypes}
            multiple
            onChange={handleFiles}
            hidden
          />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {mode === 'img2pdf' ? (
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </>
            ) : (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </>
            )}
          </svg>
          <span>
            {files.length > 0
              ? t('imgconv_filesSelected', { count: files.length })
              : mode === 'img2pdf'
                ? t('pdfconv_uploadImages')
                : t('pdfconv_uploadPdfs')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {mode === 'img2pdf' ? t('pdfconv_imgFormats') : t('pdfconv_pdfFormat')}
          </span>
        </label>
      </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {/* Controls */}
      {files.length > 0 && !converted.length && !isLimitReached && (
        <div className="webp-controls">
          {mode === 'pdf2img' && outputFormat !== 'png' && (
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
          <button
            className="convert-btn"
            onClick={handleConvert}
            disabled={processing}
            style={{ width: '100%', marginTop: 16 }}
          >
            {processing
              ? (progress || t('imgconv_converting'))
              : mode === 'img2pdf'
                ? t('pdfconv_convertToPdf', { count: files.length })
                : t('pdfconv_convertToImg', { count: files.length, format: selectedFormat.label })}
          </button>
        </div>
      )}

      {/* Results */}
      {converted.length > 0 && (
        <div className="webp-results">
          <div className="webp-summary">
            <span>
              {mode === 'img2pdf'
                ? t('pdfconv_pdfCreated', { pages: converted[0].pages })
                : t('pdfconv_imagesCreated', { count: converted.length, format: selectedFormat.label })}
            </span>
          </div>

          <div className="webp-list">
            {converted.map((item, i) => (
              <div key={i} className="webp-item">
                <div className="webp-item-preview" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-input)',
                }}>
                  {mode === 'pdf2img' ? (
                    <img src={item.url} alt={item.name} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </div>
                <div className="webp-item-info">
                  <span className="webp-item-name">{item.name}</span>
                  <span className="webp-item-sizes">{formatSize(item.newSize)}</span>
                </div>
                <button className="copy-btn" onClick={() => handleDownload(item)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {mode === 'img2pdf' ? '.pdf' : selectedFormat.ext}
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
            onClick={resetState}
            style={{ marginTop: 12 }}
          >
            {t('imgconv_convertMore')}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('pdfconv_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('pdfconv_aboutPrivacyTitle')}</h3>
            <p>{t('pdfconv_aboutPrivacy')}</p>
          </div>
          <div className="info-card">
            <h3>{t('pdfconv_aboutQualityTitle')}</h3>
            <p>{t('pdfconv_aboutQuality')}</p>
          </div>
          <div className="info-card">
            <h3>{t('pdfconv_aboutBatchTitle')}</h3>
            <p>{t('pdfconv_aboutBatch')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
