import { useState } from 'react';
import { t, useLang } from '../i18n';

export default function TranscriptView({ transcript, isPaid, videoDuration, videoTitle, srt, onUpgrade }) {
  useLang();
  const [copied, setCopied] = useState(false);
  const lines = transcript.split('\n').filter(l => l.trim());
  const isTruncated = videoDuration > 180 && !isPaid;

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSrt = () => {
    const content = srt || '';
    if (!content) return;
    const blob = new Blob([content], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const title = videoTitle || 'transcript';
    a.download = `${title.replace(/[^a-zA-Z0-9_\u3000-\u9FFF-]/g, '_').substring(0, 50)}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="transcript-section">
      <div className="section-header">
        <h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: 6 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {t('transcriptTitle')}
          {videoTitle && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 10 }}>{videoTitle}</span>}
        </h2>
      </div>

      <div className="transcript-content">
        {lines.map((line, i) => (
          <p key={i} className="transcript-line">{line}</p>
        ))}
      </div>

      {isTruncated && (
        <div className="truncated-banner">
          <div className="truncated-banner-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <p className="truncated-title">{t('truncated_title', { min: Math.floor(videoDuration / 60) })}</p>
              <p className="truncated-desc">{t('truncated_desc')}</p>
            </div>
            {onUpgrade && (
              <button className="truncated-btn" onClick={onUpgrade}>{t('truncated_btn')}</button>
            )}
          </div>
        </div>
      )}

      <div className="transcript-actions">
        <button className="copy-btn" onClick={handleCopy}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? t('copied') : t('copyAll')}
        </button>

        {isPaid && srt ? (
          <button className="srt-btn" onClick={handleDownloadSrt}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('download_srt')}
          </button>
        ) : (
          <button className="srt-locked-btn" onClick={onUpgrade}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {t('download_srt_locked')}
          </button>
        )}
      </div>
    </section>
  );
}
