import { useState } from 'react';
import { t, useLang } from '../i18n';

function srtToAss(srt) {
  const header = `[Script Info]
Title: Converted from SRT
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const blocks = srt.trim().replace(/\r\n/g, '\n').split(/\n\n+/);
  const events = blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!timeMatch) return null;

    const start = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}.${timeMatch[4].slice(0, 2)}`;
    const end = `${timeMatch[5]}:${timeMatch[6]}:${timeMatch[7]}.${timeMatch[8].slice(0, 2)}`;
    const text = lines.slice(2).join('\\N').replace(/<[^>]+>/g, '');

    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
  }).filter(Boolean);

  return header + events.join('\n');
}

export default function SrtToAss() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  useLang();

  const handleConvert = () => {
    if (!input.trim()) return;
    setOutput(srtToAss(input));
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
    const blob = new Blob([output], { type: 'text/x-ssa' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.ass`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('srtAss_title')}</h1>
        <p>{t('srtAss_desc')}</p>
      </div>

      <div className="file-upload-area">
        <label className="file-upload-label">
          <input type="file" accept=".srt" onChange={handleFile} hidden />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName || t('srtAss_upload')}
        </label>
      </div>

      <div className="converter-grid">
        <div className="converter-panel">
          <label className="panel-label">{t('srtAss_inputLabel')}</label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(''); }}
            placeholder={'1\n00:00:01,000 --> 00:00:04,000\nHello, world!'}
            spellCheck={false}
          />
        </div>
        <div className="converter-action">
          <button className="convert-btn" onClick={handleConvert} disabled={!input.trim()}>{t('srtAss_convertBtn')}</button>
        </div>
        <div className="converter-panel">
          <label className="panel-label">{t('srtAss_outputLabel')}</label>
          <textarea value={output} readOnly placeholder={t('srtAss_outputPlaceholder')} />
        </div>
      </div>

      {output && (
        <div className="converter-actions">
          <button className="copy-btn" onClick={handleCopy}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {copied ? t('srtAss_copiedBtn') : t('srtAss_copyBtn')}
          </button>
          <button className="copy-btn" onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {t('srtAss_downloadBtn')}
          </button>
        </div>
      )}

      <div className="tool-info">
        <h2>{t('srtAss_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>{t('srtAss_assTitle')}</h3>
            <p>{t('srtAss_assDesc')}</p>
          </div>
          <div className="info-card">
            <h3>{t('srtAss_styleTitle')}</h3>
            <p>{t('srtAss_styleDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
