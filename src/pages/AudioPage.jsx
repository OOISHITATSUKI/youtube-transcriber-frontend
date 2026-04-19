import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';
import TranscriptView from '../components/TranscriptView';
import SummaryView from '../components/SummaryView';
import PricingModal from '../components/PricingModal';
import LoadingAnimation from '../components/LoadingAnimation';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AudioPage() {
  useLang();
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [srtData, setSrtData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [duration, setDuration] = useState(0);
  const [fileName, setFileName] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('yt_session');
    if (saved) {
      const { token, expiresAt } = JSON.parse(saved);
      if (new Date(expiresAt) > new Date()) {
        setIsPaid(true);
        setSessionToken(token);
      } else {
        localStorage.removeItem('yt_session');
      }
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError(t('audio_fileTooLarge'));
      return;
    }
    setFile(selectedFile);
    setError('');
    setTranscript(null);
    setSummary(null);
    setSrtData(null);
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
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingType('transcribe');
    setError('');

    const formData = new FormData();
    formData.append('audio', file);
    if (sessionToken) formData.append('sessionId', sessionToken);

    try {
      const res = await fetch(`${API_URL}/api/audio-transcribe`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setError(t('audio_limitReached'));
          setShowPricing(true);
          return;
        }
        throw new Error(data.error);
      }

      setTranscript(data.transcript);
      setDuration(data.duration);
      setFileName(data.fileName);
      setSrtData(data.srt);

      if (data.isTruncated && !isPaid) {
        setTimeout(() => setShowPricing(true), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    setLoading(true);
    setLoadingType('summarize');

    try {
      const res = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handlePurchase = () => {
    const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
    if (!paymentLink) {
      alert('Payment not available');
      return;
    }
    window.open(paymentLink, '_blank');
  };

  return (
    <>
      <section className="hero">
        <div className="hero-badge"><span>{t('audio_badge')}</span></div>
        <h1>{t('audio_title')}</h1>
        <p>{t('audio_desc')}</p>
        <div className="audio-limits">
          <span className="audio-limit-free">{t('audio_free')}</span>
          <span className="audio-limit-paid">{t('audio_paid')}</span>
        </div>
      </section>

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="file-selected">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
            <div className="file-info">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button className="file-remove" onClick={() => setFile(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ) : (
          <>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">{t('audio_dropText')}</p>
            <label className="upload-select-btn">
              {t('audio_selectFile')}
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.mp4,.ogg,.flac,.webm,.mov"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                hidden
              />
            </label>
            <p className="upload-formats-text">{t('audio_formats')}</p>
          </>
        )}
      </div>

      {file && !loading && !transcript && (
        <button className="start-btn audio-start-btn" onClick={handleTranscribe}>
          {t('audio_startBtn')}
        </button>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && <LoadingAnimation type={loadingType} />}

      {transcript && !loading && (
        <>
          <TranscriptView
            transcript={transcript}
            isPaid={isPaid}
            videoDuration={duration}
            videoTitle={fileName}
            srt={srtData}
            onUpgrade={() => setShowPricing(true)}
          />
          <button onClick={handleSummarize} className="summarize-btn" disabled={loading}>
            {t('summarizeBtn')}
          </button>
        </>
      )}

      {summary && !loading && <SummaryView summary={summary} />}

      {showPricing && (
        <PricingModal
          duration={duration}
          onClose={() => setShowPricing(false)}
          userToken={sessionToken}
        />
      )}
    </>
  );
}
