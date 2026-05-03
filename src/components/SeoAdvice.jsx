import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function SeoAdvice({ transcript, autoGenerate = false }) {
  useLang();
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    if (autoGenerate && transcript && !advice && !loading) {
      handleGenerate();
    }
  }, [autoGenerate, transcript]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/seo-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdvice(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  if (!advice && !loading) {
    return (
      <div className="seo-prompt">
        <button className="seo-generate-btn" onClick={handleGenerate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          {t('seo_generateBtn')}
        </button>
        {error && <p className="seo-error">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="seo-loading">
        <div className="loading-spinner" />
        <p>{t('seo_generating')}</p>
      </div>
    );
  }

  return (
    <section className="seo-section">
      <h2>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: 6 }}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        {t('seo_title')}
      </h2>

      {/* Title Suggestions */}
      <div className="seo-block">
        <h3>{t('seo_titles')}</h3>
        {advice.titles?.map((item, i) => (
          <div key={i} className="seo-title-card" onClick={() => copyText(item.title, `title-${i}`)}>
            <div className="seo-title-text">{item.title}</div>
            <div className="seo-title-reason">{item.reason}</div>
            <span className="seo-copy-hint">
              {copiedField === `title-${i}` ? t('copied') : t('seo_clickToCopy')}
            </span>
          </div>
        ))}
      </div>

      {/* Description */}
      {advice.description && (
        <div className="seo-block">
          <h3>{t('seo_description')}</h3>
          <div className="seo-description-box" onClick={() => copyText(advice.description, 'desc')}>
            <p>{advice.description}</p>
            <span className="seo-copy-hint">
              {copiedField === 'desc' ? t('copied') : t('seo_clickToCopy')}
            </span>
          </div>
        </div>
      )}

      {/* Tags */}
      {advice.tags?.length > 0 && (
        <div className="seo-block">
          <h3>{t('seo_tags')}</h3>
          <div className="seo-tags">
            {advice.tags.map((tag, i) => (
              <span key={i} className="seo-tag" onClick={() => copyText(tag, `tag-${i}`)}>
                {tag}
              </span>
            ))}
          </div>
          <button className="copy-btn" style={{ marginTop: 8 }} onClick={() => copyText(advice.tags.join(', '), 'all-tags')}>
            {copiedField === 'all-tags' ? t('copied') : t('seo_copyAllTags')}
          </button>
        </div>
      )}

      {/* Hashtags */}
      {advice.hashtags?.length > 0 && (
        <div className="seo-block">
          <h3>{t('seo_hashtags')}</h3>
          <div className="seo-tags">
            {advice.hashtags.map((tag, i) => (
              <span key={i} className="seo-tag hashtag">{tag}</span>
            ))}
          </div>
          <button className="copy-btn" style={{ marginTop: 8 }} onClick={() => copyText(advice.hashtags.join(' '), 'all-hashtags')}>
            {copiedField === 'all-hashtags' ? t('copied') : t('seo_copyAllTags')}
          </button>
        </div>
      )}

      {/* Key Moments / Chapters */}
      {advice.keyMoments?.length > 0 && (
        <div className="seo-block">
          <h3>{t('seo_chapters')}</h3>
          <div className="seo-chapters" onClick={() => copyText(advice.keyMoments.map(m => `${m.time} ${m.label}`).join('\n'), 'chapters')}>
            {advice.keyMoments.map((m, i) => (
              <div key={i} className="seo-chapter">
                <span className="seo-chapter-time">{m.time}</span>
                <span>{m.label}</span>
              </div>
            ))}
            <span className="seo-copy-hint">
              {copiedField === 'chapters' ? t('copied') : t('seo_clickToCopy')}
            </span>
          </div>
        </div>
      )}

      {/* Tips */}
      {advice.tips?.length > 0 && (
        <div className="seo-block">
          <h3>{t('seo_tips')}</h3>
          <ul className="seo-tips">
            {advice.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
