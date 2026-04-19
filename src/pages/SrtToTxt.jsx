import { useState } from 'react';
import { t, useLang } from '../i18n';

function srtToTxt(srt, includeTimestamps) {
  const blocks = srt.trim().replace(/\r\n/g, '\n').split(/\n\n+/);
  const lines = blocks.map(block => {
    const parts = block.split('\n');
    if (parts.length < 3) return null;
    const timeMatch = parts[1].match(/(\d{2}:\d{2}:\d{2})/);
    const text = parts.slice(2).join(' ').replace(/<[^>]+>/g, '').trim();
    if (!text) return null;
    if (includeTimestamps && timeMatch) {
      return `[${timeMatch[1]}] ${text}`;
    }
    return text;
  }).filter(Boolean);

  return lines.join('\n');
}

export default function SrtToTxt() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  const [includeTimestamps, setIncludeTimestamps] = useState(false);
  useLang();

  const handleConvert = () => {
    if (!input.trim()) return;
    setOutput(srtToTxt(input, includeTimestamps));
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
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = output ? output.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('srtTxt_title')}</h1>
        <p>{t('srtTxt_desc')}</p>
      </div>

      <div className="file-upload-area">
        <label className="file-upload-label">
          <input type="file" accept=".srt" onChange={handleFile} hidden />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName || t('srtTxt_upload')}
        </label>
      </div>

      <div className="option-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={includeTimestamps}
            onChange={(e) => { setIncludeTimestamps(e.target.checked); setOutput(''); }}
          />
          {t('srtTxt_includeTimestamps')}
        </label>
      </div>

      <div className="converter-grid">
        <div className="converter-panel">
          <label className="panel-label">{t('srtTxt_inputLabel')}</label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(''); }}
            placeholder={'1\n00:00:01,000 --> 00:00:04,000\nHello, world!\n\n2\n00:00:05,000 --> 00:00:08,000\nThis is a subtitle.'}
            spellCheck={false}
          />
        </div>
        <div className="converter-action">
          <button className="convert-btn" onClick={handleConvert} disabled={!input.trim()}>{t('srtTxt_extractBtn')}</button>
        </div>
        <div className="converter-panel">
          <label className="panel-label">{t('srtTxt_outputLabel')} {output && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{t('srtTxt_outputWords', { count: wordCount })}</span>}</label>
          <textarea value={output} readOnly placeholder={t('srtTxt_outputPlaceholder')} />
        </div>
      </div>

      {output && (
        <div className="converter-actions">
          <button className="copy-btn" onClick={handleCopy}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {copied ? t('srtTxt_copiedBtn') : t('srtTxt_copyBtn')}
          </button>
          <button className="copy-btn" onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {t('srtTxt_downloadBtn')}
          </button>
        </div>
      )}
    </div>
  );
}
