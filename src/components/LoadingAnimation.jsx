import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';

export default function LoadingAnimation({ type }) {
  useLang();
  const [msgIndex, setMsgIndex] = useState(0);

  const getMessages = () => {
    if (type === 'summarize') {
      return [t('loadAnalyzeContent'), t('loadExtract'), t('loadGenerate')];
    }
    return [t('loadFetch'), t('loadAnalyze'), t('loadConvert'), t('loadTimestamp')];
  };

  const msgs = getMessages();

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % msgs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [msgs.length]);

  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-msg">{msgs[msgIndex]}</p>
      <p className="loading-note">
        {type === 'transcribe' ? t('loadNoteTranscribe') : t('loadNoteSummarize')}
      </p>
    </div>
  );
}
