import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';
import Hero from '../components/Hero';
import UrlInput from '../components/UrlInput';
import TranscriptView from '../components/TranscriptView';
import SummaryView from '../components/SummaryView';
import PricingModal from '../components/PricingModal';
import PsychologyBanner from '../components/PsychologyBanner';
import LoadingAnimation from '../components/LoadingAnimation';

const API_URL = import.meta.env.VITE_API_URL || '';

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

const DEMO_SUMMARY = `This video provides a comprehensive overview of the latest AI developments. From 2024 to 2025, large language models have evolved dramatically, with multimodal AI being the standout advancement — models that can process text, images, and audio simultaneously. Practical applications like automatic video summarization and real-time translation have emerged, driving rapid enterprise adoption. The video highlights three key areas: healthcare (where AI image diagnostics now rival human doctors), education (enabling personalized learning), and creative fields (with vastly improved AI-generated content). The discussion also addresses growing AI ethics concerns around privacy and bias, emphasizing the need for responsible development. Looking ahead, AGI research is accelerating, signaling a new era of human-AI coexistence.`;

export default function HomePage() {
  useLang();
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
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [srtData, setSrtData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutSessionId = params.get('session_id');
    if (checkoutSessionId) {
      verifyPayment(checkoutSessionId);
      window.history.replaceState({}, '', '/');
    }
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

  const handleTranscribe = async (url) => {
    setLoading(true);
    setLoadingType('transcribe');
    setError('');
    setTranscript(null);
    setSummary(null);
    setSrtData(null);
    setIsDemo(false);

    if (!API_URL) {
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
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setLoadingType('transcribe');
    setError('');
    setTranscript(null);
    setSummary(null);
    setShowUpload(false);

    if (!API_URL) {
      setTimeout(() => {
        setTranscript(DEMO_TRANSCRIPT);
        setVideoDuration(630);
        setVideoTitle('Uploaded file (demo)');
        setIsDemo(true);
        setLoading(false);
        setLoadingType('');
      }, 2500);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/transcribe/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTranscript(data.transcript);
      setVideoDuration(data.duration || 0);
      setVideoTitle(data.title || file.name);
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

    if (isDemo || !API_URL) {
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

  const handlePurchase = () => {
    const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
    if (!paymentLink) {
      alert(t('demoPaymentAlert'));
      return;
    }
    window.open(paymentLink, '_blank');
  };

  return (
    <>
      <Hero />
      <UrlInput onSubmit={handleTranscribe} loading={loading} />

      {error && <div className="error-banner">{error}</div>}

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

      {showPricing && (
        <PricingModal
          duration={videoDuration}
          onClose={() => setShowPricing(false)}
          userToken={sessionToken}
        />
      )}
    </>
  );
}
