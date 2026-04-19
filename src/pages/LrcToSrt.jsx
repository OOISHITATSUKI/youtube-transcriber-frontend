import { useState } from 'react';
import { t, useLang } from '../i18n';

function lrcToSrt(lrc) {
  const lines = lrc.trim().replace(/\r\n/g, '\n').split('\n');
  const entries = [];

  for (const line of lines) {
    // Match [mm:ss.xx] or [mm:ss.xxx] patterns
    const match = line.match(/^\[(\d{1,2}):(\d{2})[.](\d{2,3})\]\s*(.*)$/);
    if (!match) continue;
    const text = match[4].trim();
    if (!text) continue;

    const m = parseInt(match[1]);
    const s = parseInt(match[2]);
    let ms = match[3];
    if (ms.length === 2) ms = ms + '0';
    const totalMs = m * 60000 + s * 1000 + parseInt(ms);
    entries.push({ totalMs, text });
  }

  if (entries.length === 0) return '';

  const srtBlocks = entries.map((entry, i) => {
    const startMs = entry.totalMs;
    const endMs = i + 1 < entries.length ? entries[i + 1].totalMs : startMs + 3000;

    const formatTime = (ms) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const milli = ms % 1000;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(milli).padStart(3, '0')}`;
    };

    return `${i + 1}\n${formatTime(startMs)} --> ${formatTime(endMs)}\n${entry.text}`;
  });

  return srtBlocks.join('\n\n');
}

export default function LrcToSrt() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  useLang();

  const handleConvert = () => {
    if (!input.trim()) return;
    setOutput(lrcToSrt(input));
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
    const baseName = fileName ? fileName.replace(/\.lrc$/i, '') : 'lyrics';
    const blob = new Blob([output], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('lrcSrt_title')}</h1>
        <p>{t('lrcSrt_desc')}</p>
      </div>

      <div className="file-upload-area">
        <label className="file-upload-label">
          <input type="file" accept=".lrc,.txt" onChange={handleFile} hidden />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName || t('lrcSrt_upload')}
        </label>
      </div>

      <div className="converter-grid">
        <div className="converter-panel">
          <label className="panel-label">{t('lrcSrt_inputLabel')}</label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(''); }}
            placeholder={'[00:12.00] First line of lyrics\n[00:17.20] Second line of lyrics\n[00:21.10] Third line of lyrics'}
            spellCheck={false}
          />
        </div>
        <div className="converter-action">
          <button className="convert-btn" onClick={handleConvert} disabled={!input.trim()}>{t('lrcSrt_convertBtn')}</button>
        </div>
        <div className="converter-panel">
          <label className="panel-label">{t('lrcSrt_outputLabel')}</label>
          <textarea value={output} readOnly placeholder={t('lrcSrt_outputPlaceholder')} />
        </div>
      </div>

      {output && (
        <div className="converter-actions">
          <button className="copy-btn" onClick={handleCopy}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {copied ? t('lrcSrt_copiedBtn') : t('lrcSrt_copyBtn')}
          </button>
          <button className="copy-btn" onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {t('lrcSrt_downloadBtn')}
          </button>
        </div>
      )}

      <div className="tool-info">
        <h2>{t('lrcSrt_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('lrcSrt_lrcTitle')}</h3>
            <p>{t('lrcSrt_lrcDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('lrcSrt_conversionTitle')}</h3>
            <p>{t('lrcSrt_conversionDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
