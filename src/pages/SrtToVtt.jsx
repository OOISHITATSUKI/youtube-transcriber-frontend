import { useState } from 'react';
import { t, useLang } from '../i18n';

function srtToVtt(srt) {
  let vtt = 'WEBVTT\n\n';
  vtt += srt
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
    .replace(/^\d+\n/gm, '');
  return vtt.trim();
}

export default function SrtToVtt() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  useLang();

  const handleConvert = () => {
    if (!input.trim()) return;
    setOutput(srtToVtt(input));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { setInput(ev.target.result); setOutput(''); };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const baseName = fileName ? fileName.replace(/\.srt$/i, '') : 'subtitle';
    const blob = new Blob([output], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('srtVtt_title')}</h1>
        <p>{t('srtVtt_desc')}</p>
      </div>

      <div className="file-upload-area">
        <label className="file-upload-label">
          <input type="file" accept=".srt" onChange={handleFile} hidden />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName || t('srtVtt_upload')}
        </label>
      </div>

      <div className="converter-grid">
        <div className="converter-panel">
          <label className="panel-label">{t('srtVtt_inputLabel')}</label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(''); }}
            placeholder={'1\n00:00:01,000 --> 00:00:04,000\nHello, world!\n\n2\n00:00:05,000 --> 00:00:08,000\nThis is a subtitle.'}
            spellCheck={false}
          />
        </div>
        <div className="converter-action">
          <button className="convert-btn" onClick={handleConvert} disabled={!input.trim()}>{t('srtVtt_convertBtn')}</button>
        </div>
        <div className="converter-panel">
          <label className="panel-label">{t('srtVtt_outputLabel')}</label>
          <textarea value={output} readOnly placeholder={t('srtVtt_outputPlaceholder')} />
        </div>
      </div>

      {output && (
        <div className="converter-actions">
          <button className="copy-btn" onClick={handleCopy}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {copied ? t('srtVtt_copiedBtn') : t('srtVtt_copyBtn')}
          </button>
          <button className="copy-btn" onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {t('srtVtt_downloadBtn')}
          </button>
        </div>
      )}

      <div className="tool-info">
        <h2>{t('srtVtt_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('srtVtt_srtTitle')}</h3>
            <p>{t('srtVtt_srtDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('srtVtt_vttTitle')}</h3>
            <p>{t('srtVtt_vttDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
