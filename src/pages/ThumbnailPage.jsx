import { useState } from 'react';
import { t, useLang } from '../i18n';
import { useAuth } from '../AuthContext';
import PricingModal from '../components/PricingModal';

const API_URL = import.meta.env.VITE_API_URL || '';
const CREDITS_PER_GENERATION = 3;

export default function ThumbnailPage() {
  useLang();
  const auth = useAuth();
  const [content, setContent] = useState('');
  const [contentFileName, setContentFileName] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [refImages, setRefImages] = useState([]); // File[]
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageMode, setImageMode] = useState('asIs'); // 'asIs' | 'removeBg' | 'edit'

  const isPaid = auth.isPaid;
  const sessionToken = auth.sessionToken;

  // Text file attachment
  const handleTextFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'srt', 'vtt', 'ass', 'lrc', 'csv', 'md'].includes(ext)) {
      setError(t('thumb_invalidTextFile'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('thumb_textFileTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result;
      // Strip SRT/VTT timestamps
      if (ext === 'srt' || ext === 'vtt') {
        text = text
          .replace(/^\d+\s*$/gm, '')
          .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, '')
          .replace(/WEBVTT.*$/m, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
      setContent(text);
      setContentFileName(file.name);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleImageSelect = (files) => {
    const newFiles = Array.from(files).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['png', 'jpg', 'jpeg', 'webp'].includes(ext) && f.size <= 10 * 1024 * 1024;
    });
    setRefImages(prev => [...prev, ...newFiles].slice(0, 3));
  };

  const removeImage = (index) => {
    setRefImages(prev => prev.filter((_, i) => i !== index));
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
    if (e.dataTransfer.files?.length) handleImageSelect(e.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (!content.trim() && !userPrompt.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    if (content.trim()) formData.append('content', content.trim());
    if (userPrompt.trim()) formData.append('prompt', userPrompt.trim());
    formData.append('count', String(isPaid ? count : 1));
    if (sessionToken) formData.append('sessionId', sessionToken);

    if (refImages.length > 0) {
      formData.append('imageMode', imageMode);
      refImages.forEach(file => {
        formData.append('images', file);
      });
    }

    try {
      const res = await fetch(`${API_URL}/api/thumbnail/generate`, {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(t('thumb_serverError'));
      }

      if (!res.ok) {
        if (data.limitReached) {
          setShowPricing(true);
        }
        throw new Error(data.error);
      }

      setResults(data);
      if (auth.refreshCredits) auth.refreshCredits();
    } catch (err) {
      setError(err.message || t('thumb_serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (thumbnailUrl, index) => {
    try {
      const res = await fetch(`${API_URL}${thumbnailUrl}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-thumbnail-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${API_URL}${thumbnailUrl}`, '_blank');
    }
  };

  const handleReset = () => {
    setResults(null);
    setContent('');
    setContentFileName('');
    setUserPrompt('');
    setRefImages([]);
    setError('');
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="hero-badge"><span>AI</span></div>
        <h1>{t('thumb_title')}</h1>
        <p>{t('thumb_desc')}</p>
        <div className="thumb-limits">
          <span className="audio-limit-free">{t('thumb_free')}</span>
          <span className="audio-limit-paid">{t('thumb_paid')}</span>
        </div>
      </div>

      {/* Expiry Notice */}
      <div className="thumb-expiry-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {t('thumb_expiry')}
      </div>

      {!results ? (
        <>
          {/* Content / Transcript Input */}
          <div className="thumb-section">
            <label className="thumb-label">
              {t('thumb_contentLabel')}
            </label>

            {/* Text file upload */}
            <div className="thumb-text-attach">
              <label className="thumb-text-attach-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {t('thumb_attachFile')}
                <input
                  type="file"
                  accept=".txt,.srt,.vtt,.ass,.lrc,.csv,.md"
                  onChange={(e) => e.target.files?.[0] && handleTextFile(e.target.files[0])}
                  hidden
                />
              </label>
              {contentFileName && (
                <span className="thumb-text-filename">
                  {contentFileName}
                  <button onClick={() => { setContent(''); setContentFileName(''); }} className="thumb-text-file-remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </span>
              )}
              <span className="thumb-text-attach-hint">{t('thumb_attachFormats')}</span>
            </div>

            <textarea
              className="vseo-textarea"
              value={content}
              onChange={(e) => { setContent(e.target.value); setContentFileName(''); }}
              placeholder={t('thumb_contentPlaceholder')}
              rows={6}
            />
            {content && (
              <span className="vseo-char-count">
                {content.length.toLocaleString()} {t('vseo_chars')}
              </span>
            )}
          </div>

          {/* Custom Prompt */}
          <div className="thumb-section">
            <label className="thumb-label">{t('thumb_promptLabel')}</label>
            <textarea
              className="vseo-textarea"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={t('thumb_promptPlaceholder')}
              rows={3}
            />
          </div>

          {/* Reference Images */}
          <div className="thumb-section">
            <label className="thumb-label">
              {t('thumb_imagesLabel')}
              <span className="thumb-label-sub">{t('thumb_imagesOptional')}</span>
            </label>

            {refImages.length > 0 && (
              <div className="thumb-ref-images">
                {refImages.map((file, i) => (
                  <div key={i} className="thumb-ref-item">
                    <img src={URL.createObjectURL(file)} alt="" />
                    <button className="thumb-ref-remove" onClick={() => removeImage(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <span className="thumb-ref-name">{file.name}</span>
                  </div>
                ))}
              </div>
            )}

            {refImages.length < 3 && (
              <div
                className={`thumb-image-upload ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <label className="thumb-image-upload-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {t('thumb_addImage')} ({refImages.length}/3)
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    multiple
                    onChange={(e) => e.target.files?.length && handleImageSelect(e.target.files)}
                    hidden
                  />
                </label>
                <span className="thumb-image-hint">PNG, JPG, WebP（{t('thumb_imageMax')}）</span>
              </div>
            )}

            {/* Image Mode Selector - show when images are added */}
            {refImages.length > 0 && (
              <div className="thumb-image-mode">
                <label className="thumb-label" style={{ marginTop: 12 }}>{t('thumb_imageModeLabel')}</label>
                <div className="thumb-image-mode-options">
                  {[
                    { value: 'asIs', label: t('thumb_modeAsIs'), desc: t('thumb_modeAsIsDesc') },
                    { value: 'removeBg', label: t('thumb_modeRemoveBg'), desc: t('thumb_modeRemoveBgDesc') },
                    { value: 'edit', label: t('thumb_modeEdit'), desc: t('thumb_modeEditDesc') },
                  ].map(mode => (
                    <button
                      key={mode.value}
                      className={`thumb-mode-btn ${imageMode === mode.value ? 'active' : ''}`}
                      onClick={() => setImageMode(mode.value)}
                    >
                      <span className="thumb-mode-label">{mode.label}</span>
                      <span className="thumb-mode-desc">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Count Selector (paid only) */}
          {isPaid && (
            <div className="thumb-section">
              <label className="thumb-label">{t('thumb_countLabel')}</label>
              <div className="thumb-count-selector">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    className={`thumb-count-btn ${count === n ? 'active' : ''}`}
                    onClick={() => setCount(n)}
                  >
                    {n}{t('thumb_countUnit')}
                  </button>
                ))}
              </div>
              <p className="thumb-credit-note">
                {t('thumb_creditNote').replace('{credits}', CREDITS_PER_GENERATION)}
              </p>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {/* Generate Button */}
          <button
            className="convert-btn"
            onClick={handleGenerate}
            disabled={loading || (!content.trim() && !userPrompt.trim())}
            style={{ width: '100%', marginTop: 16 }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                {t('thumb_generating')}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                {t('thumb_generateBtn')}
              </>
            )}
          </button>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="thumb-results">
            <h2>{t('thumb_resultsTitle')}</h2>
            <p className="thumb-results-expiry">{t('thumb_resultsExpiry')}</p>

            <div className="thumb-gallery">
              {results.thumbnails.map((thumb, i) => (
                <div key={i} className="thumb-result-card">
                  <div className="thumb-result-image">
                    <img src={`${API_URL}${thumb.url}`} alt={`Thumbnail ${i + 1}`} />
                  </div>
                  <button
                    className="convert-btn thumb-download-btn"
                    onClick={() => handleDownload(thumb.url, i)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {t('thumb_download')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="copy-btn" onClick={handleReset} style={{ marginTop: 24, width: '100%' }}>
            {t('thumb_newGeneration')}
          </button>
        </>
      )}

      {/* Info Section */}
      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('thumb_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('thumb_about1Title')}</h3>
            <p>{t('thumb_about1Desc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('thumb_about2Title')}</h3>
            <p>{t('thumb_about2Desc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('thumb_about3Title')}</h3>
            <p>{t('thumb_about3Desc')}</p>
          </div>
        </div>
      </div>

      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          userToken={sessionToken}
        />
      )}
    </div>
  );
}
