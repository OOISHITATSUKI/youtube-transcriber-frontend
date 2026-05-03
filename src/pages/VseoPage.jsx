import { useState, useRef } from 'react';
import { t, useLang } from '../i18n';
import SeoAdvice from '../components/SeoAdvice';

export default function VseoPage() {
  useLang();
  const [transcript, setTranscript] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const textareaRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'srt', 'vtt', 'ass', 'lrc', 'csv'].includes(ext)) {
      alert(t('vseo_invalidFile'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result;
      // Strip SRT/VTT timestamps if needed
      if (ext === 'srt' || ext === 'vtt') {
        text = parseSrtToText(text);
      }
      setTranscript(text);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setTranscript('');
    setSubmitted(false);
    setFileName('');
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('vseo_title')}</h1>
        <p>{t('vseo_desc')}</p>
      </div>

      {!submitted ? (
        <>
          {/* File Upload */}
          <div
            className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
          >
            <label className="file-upload-label file-upload-large">
              <input
                type="file"
                accept=".txt,.srt,.vtt,.ass,.lrc,.csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                hidden
              />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>{fileName || t('vseo_uploadLabel')}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('vseo_fileFormats')}
              </span>
            </label>
          </div>

          <div className="vseo-divider">
            <span>{t('vseo_or')}</span>
          </div>

          {/* Text Input */}
          <div className="vseo-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="vseo-textarea"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t('vseo_placeholder')}
              rows={10}
            />
            {transcript && (
              <span className="vseo-char-count">
                {transcript.length.toLocaleString()} {t('vseo_chars')}
              </span>
            )}
          </div>

          <button
            className="convert-btn"
            onClick={handleSubmit}
            disabled={!transcript.trim()}
            style={{ width: '100%', marginTop: 16 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            {t('vseo_analyzeBtn')}
          </button>
        </>
      ) : (
        <>
          <SeoAdvice transcript={transcript} autoGenerate />

          <button
            className="copy-btn"
            onClick={handleReset}
            style={{ marginTop: 16 }}
          >
            {t('vseo_newAnalysis')}
          </button>
        </>
      )}

      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('vseo_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('vseo_aboutTitlesTitle')}</h3>
            <p>{t('vseo_aboutTitlesDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('vseo_aboutTagsTitle')}</h3>
            <p>{t('vseo_aboutTagsDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('vseo_aboutChaptersTitle')}</h3>
            <p>{t('vseo_aboutChaptersDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseSrtToText(srt) {
  return srt
    .replace(/^\d+\s*$/gm, '')                // Remove sequence numbers
    .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, '') // Remove timestamps
    .replace(/WEBVTT.*$/m, '')                 // Remove VTT header
    .replace(/<[^>]+>/g, '')                   // Remove HTML tags
    .replace(/\n{3,}/g, '\n\n')               // Collapse blank lines
    .trim();
}
