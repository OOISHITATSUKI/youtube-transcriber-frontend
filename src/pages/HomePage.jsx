import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';
import { useAuth } from '../AuthContext';
import Hero from '../components/Hero';
import UrlInput from '../components/UrlInput';
import TranscriptView from '../components/TranscriptView';
import SummaryView from '../components/SummaryView';
import PricingModal from '../components/PricingModal';
import PsychologyBanner from '../components/PsychologyBanner';
import LoadingAnimation from '../components/LoadingAnimation';
import SeoAdvice from '../components/SeoAdvice';

const API_URL = import.meta.env.VITE_API_URL || '';
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_TRANSCRIPT = `[00:00] Hey everyone, today we're going to talk about the latest developments in AI.
[00:08] Let's start by looking at the evolution of large language models.
[00:15] From 2024 to 2025, AI has made remarkable progress.
[00:23] What's particularly noteworthy is the development of multimodal AI.
[00:30] Models can now understand not just text, but also images and audio.
[00:38] This has dramatically expanded the range of AI applications.
[00:45] For example, automatic video summarization and real-time translation are now possible.
[00:53] Enterprise adoption has surged, contributing significantly to business efficiency.
[01:01] Next, I'd like to touch on AI ethics.
[01:08] As technology advances, privacy and bias concerns are becoming increasingly important.
[01:16] Responsible AI development will be even more critical going forward.
[01:23] Let's look at some specific examples.
[01:30] First is AI in healthcare.
[01:38] Image diagnostics accuracy has begun surpassing human doctors in some cases.
[01:45] Second is education — personalized learning plans are now achievable.
[01:53] And third is the creative field, where AI-generated content quality has improved dramatically.
[02:00] As these examples show, AI is fundamentally transforming our lives.
[02:08] Finally, let's discuss the future outlook.
[02:15] Research toward AGI — artificial general intelligence — is accelerating.
[02:23] We're standing at the threshold of a new era of human-AI coexistence.
[02:30] Thanks for watching. Don't forget to subscribe!`;

const DEMO_SUMMARY = `This video provides a comprehensive overview of the latest AI developments.`;

export default function HomePage() {
  useLang();
  const auth = useAuth();
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTitle, setVideoTitle] = useState('');
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [srtData, setSrtData] = useState(null);
  const [showExtensionBanner, setShowExtensionBanner] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState('url'); // 'url' | 'upload'
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutSessionId = params.get('session_id');
    if (checkoutSessionId) {
      verifyPayment(checkoutSessionId);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const handler = () => setShowPricing(true);
    window.addEventListener('openPricing', handler);
    return () => window.removeEventListener('openPricing', handler);
  }, []);

  const verifyPayment = async (checkoutSessionId) => {
    try {
      const res = await fetch(`${API_URL}/api/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutSessionId }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        setIsPaid(true);
        setSessionToken(data.accessToken);
        localStorage.setItem('yt_session', JSON.stringify({
          token: data.accessToken,
          expiresAt: data.expiresAt,
        }));
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
    }
  };

  useEffect(() => {
    if (auth.isLoggedIn) {
      setSessionToken(auth.sessionToken);
      if (auth.isPaid) setIsPaid(true);
      return;
    }
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
  }, [auth.isLoggedIn, auth.sessionToken, auth.isPaid]);

  const handleTranscribe = async (url) => {
    setLoading(true);
    setLoadingType('transcribe');
    setError('');
    setTranscript(null);
    setSummary(null);
    setSrtData(null);
    setIsDemo(false);
    setShowExtensionBanner(false);
    setSubmittedUrl(url);

    if (IS_DEMO) {
      setTimeout(() => {
        setTranscript(DEMO_TRANSCRIPT);
        setVideoDuration(630);
        setVideoTitle('The Future of AI: 2025 and Beyond');
        setIsDemo(true);
        setLoading(false);
        setLoadingType('');
      }, 2500);
      return;
    }

    try {
      // Try server-side transcription first
      const res = await fetch(`${API_URL}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, sessionId: sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTranscript(data.transcript);
      setVideoDuration(data.duration);
      setVideoTitle(data.title);
      setSrtData(data.srt || null);
      if (data.isTruncated && !isPaid) {
        setTimeout(() => setShowPricing(true), 2500);
      }
    } catch (err) {
      // Server failed → show Chrome extension banner
      setShowExtensionBanner(true);
      setError('');
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setLoadingType('transcribe');
    setError('');
    setShowTextInput(false);

    try {
      let formattedTranscript = textInput;
      let srt = null;
      try {
        const res = await fetch(`${API_URL}/api/format-transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: textInput }),
        });
        if (res.ok) {
          const data = await res.json();
          formattedTranscript = data.transcript || textInput;
          srt = data.srt || null;
        }
      } catch {}

      setTranscript(formattedTranscript);
      setVideoTitle('テキスト入力');
      setVideoDuration(0);
      setSrtData(srt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      setError(t('audio_fileTooLarge'));
      return;
    }
    setUploadFile(file);
    setError('');
    setTranscript(null);
    setSummary(null);
    setSrtData(null);
  };

  const handleFileDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUploadTranscribe = async () => {
    if (!uploadFile) return;
    setLoading(true);
    setLoadingType('transcribe');
    setError('');
    setTranscript(null);
    setSummary(null);
    setSrtData(null);
    setIsDemo(false);

    const formData = new FormData();
    formData.append('audio', uploadFile);
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
      setVideoDuration(data.duration);
      setVideoTitle(data.fileName);
      setSrtData(data.srt || null);

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

    if (isDemo) {
      setTimeout(() => {
        setSummary(DEMO_SUMMARY);
        setLoading(false);
        setLoadingType('');
      }, 2000);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, sessionId: sessionToken }),
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

  return (
    <>
      <Hero />

      {/* Input Mode Tabs */}
      <div className="input-mode-tabs">
        <button
          className={`input-mode-tab ${inputMode === 'url' ? 'active' : ''}`}
          onClick={() => { setInputMode('url'); setError(''); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {t('input_urlTitle')}
        </button>
        <button
          className={`input-mode-tab ${inputMode === 'upload' ? 'active' : ''}`}
          onClick={() => { setInputMode('upload'); setError(''); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {t('input_uploadTitle')}
        </button>
      </div>

      {/* URL Input */}
      {inputMode === 'url' && (
        <UrlInput onSubmit={handleTranscribe} loading={loading} />
      )}

      {/* File Upload */}
      {inputMode === 'upload' && !transcript && (
        <>
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploadFile ? 'has-file' : ''}`}
            onDragEnter={handleFileDrag}
            onDragLeave={handleFileDrag}
            onDragOver={handleFileDrag}
            onDrop={handleFileDrop}
          >
            {uploadFile ? (
              <div className="file-selected">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <div className="file-info">
                  <p className="file-name">{uploadFile.name}</p>
                  <p className="file-size">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button className="file-remove" onClick={() => setUploadFile(null)}>
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
                <p className="upload-text">{t('home_upload_drop')}</p>
                <label className="upload-select-btn">
                  {t('home_upload_select')}
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,.mp4,.ogg,.flac,.webm,.mov,.mpeg,.mpga"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    hidden
                  />
                </label>
                <p className="upload-formats-text">
                  MP3, MP4, M4A, WAV, WebM, MOV, OGG, FLAC（{t('home_upload_maxSize')}）
                </p>
              </>
            )}
          </div>

          {uploadFile && !loading && (
            <button className="start-btn" onClick={handleUploadTranscribe} style={{ width: '100%' }}>
              {t('home_upload_startBtn')}
            </button>
          )}
        </>
      )}

      {error && <div className="error-banner">{error}</div>}

      {/* Chrome Extension Banner */}
      {showExtensionBanner && (
        <div className="extension-banner">
          <div className="extension-banner-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
          </div>
          <h3>{t('ext_banner_title')}</h3>
          <p>{t('ext_banner_desc')}</p>
          <div className="extension-banner-actions">
            <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="extension-banner-btn primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
              {t('ext_banner_install')}
            </a>
            <button className="extension-banner-btn secondary" onClick={() => { setShowExtensionBanner(false); setShowTextInput(true); }}>
              {t('ext_banner_paste')}
            </button>
          </div>
        </div>
      )}

      {/* Text Input Fallback */}
      {showTextInput && !transcript && (
        <div className="text-input-section">
          <h3>{t('ext_text_title')}</h3>
          <textarea
            className="text-input-area"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t('ext_text_placeholder')}
            rows={8}
          />
          <button
            className="start-btn"
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || loading}
            style={{ width: '100%', marginTop: 12 }}
          >
            {t('ext_text_submit')}
          </button>
        </div>
      )}

      {loading && <LoadingAnimation type={loadingType} />}

      {transcript && !loading && (
        <>
          {isDemo && (
            <div className="demo-tag" style={{ textAlign: 'center', marginBottom: 16, display: 'block' }}>
              {t('demoTag')}
            </div>
          )}

          {videoDuration > 180 && !isPaid && (
            <PsychologyBanner
              duration={videoDuration}
              onPurchase={() => setShowPricing(true)}
            />
          )}

          <TranscriptView
            transcript={transcript}
            isPaid={isPaid}
            videoDuration={videoDuration}
            videoTitle={videoTitle}
            srt={srtData}
            sourceUrl={submittedUrl}
            onUpgrade={() => setShowPricing(true)}
          />

          <button
            onClick={handleSummarize}
            className="summarize-btn"
            disabled={loading}
          >
            {t('summarizeBtn')}
          </button>
        </>
      )}

      {summary && !loading && (
        <SummaryView summary={summary} />
      )}

      {transcript && !loading && (
        <SeoAdvice transcript={transcript} autoGenerate={inputMode === 'upload'} />
      )}

      {showPricing && (
        <PricingModal
          duration={videoDuration}
          onClose={() => setShowPricing(false)}
          userToken={auth.sessionToken || sessionToken}
        />
      )}
    </>
  );
}
