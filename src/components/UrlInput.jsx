import { useState } from 'react';
import { t, useLang } from '../i18n';

export default function UrlInput({ onSubmit, loading }) {
  useLang();
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <form className="url-input-section" onSubmit={handleSubmit}>
      <div className="url-input-wrapper">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('placeholder')}
          disabled={loading}
        />
      </div>
      <button type="submit" className="start-btn" disabled={loading || !url.trim()}>
        {loading ? t('processing') : t('startBtn')}
      </button>
    </form>
  );
}
