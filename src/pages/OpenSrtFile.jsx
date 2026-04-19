import { useState } from 'react';
import { t, useLang } from '../i18n';

function parseSrt(text) {
  const blocks = text.trim().replace(/\r\n/g, '\n').split(/\n\n+/);
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    const index = lines[0].trim();
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!timeMatch) return null;
    const text = lines.slice(2).join('\n');
    return { index, start: timeMatch[1], end: timeMatch[2], text };
  }).filter(Boolean);
}

function timeToSeconds(t) {
  const [h, m, rest] = t.split(':');
  const [s, ms] = rest.split(/[,.]/);
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function OpenSrtFile() {
  const [subs, setSubs] = useState([]);
  const [fileName, setFileName] = useState('');
  const [search, setSearch] = useState('');
  const [rawText, setRawText] = useState('');
  useLang();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setRawText(text);
      setSubs(parseSrt(text));
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!rawText.trim()) return;
    setSubs(parseSrt(rawText));
  };

  const filtered = search
    ? subs.filter(s => s.text.toLowerCase().includes(search.toLowerCase()))
    : subs;

  const totalDuration = subs.length > 0
    ? timeToSeconds(subs[subs.length - 1].end) - timeToSeconds(subs[0].start)
    : 0;

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t('openSrt_title')}</h1>
        <p>{t('openSrt_desc')}</p>
      </div>

      <div className="file-upload-area">
        <label className="file-upload-label">
          <input type="file" accept=".srt" onChange={handleFile} hidden />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName || t('openSrt_upload')}
        </label>
      </div>

      {!subs.length && (
        <div className="paste-section">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t('openSrt_pastePlaceholder')}
            className="paste-textarea"
            spellCheck={false}
          />
          <button className="convert-btn" onClick={handlePaste} disabled={!rawText.trim()} style={{ marginTop: 12, width: '100%' }}>
            {t('openSrt_openBtn')}
          </button>
        </div>
      )}

      {subs.length > 0 && (
        <>
          <div className="srt-stats">
            <div className="stat-item">
              <span className="stat-value">{subs.length}</span>
              <span className="stat-label">{t('openSrt_subtitles')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatDuration(totalDuration)}</span>
              <span className="stat-label">{t('openSrt_duration')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{subs.reduce((a, s) => a + s.text.length, 0)}</span>
              <span className="stat-label">{t('openSrt_characters')}</span>
            </div>
          </div>

          <div className="srt-search">
            <input
              type="text"
              placeholder={t('openSrt_searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="srt-table-wrap">
            <table className="srt-table">
              <thead>
                <tr>
                  <th>{t('openSrt_thIndex')}</th>
                  <th>{t('openSrt_thStart')}</th>
                  <th>{t('openSrt_thEnd')}</th>
                  <th>{t('openSrt_thText')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
                  <tr key={i}>
                    <td className="srt-index">{sub.index}</td>
                    <td className="srt-time">{sub.start}</td>
                    <td className="srt-time">{sub.end}</td>
                    <td className="srt-text">{sub.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {search && (
            <p className="search-count">{t('openSrt_searchCount', { filtered: filtered.length, total: subs.length })}</p>
          )}
        </>
      )}
    </div>
  );
}
