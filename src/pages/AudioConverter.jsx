import { useState } from 'react';
import { t, useLang } from '../i18n';
import lamejs from '../lib/lamejs-wrapper.js';

const MAX_FILES = 5;

function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  const numSamples = audioBuffer.length;
  const dataLength = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function encodeMp3(audioBuffer, bitrate) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.length;

  const left = audioBuffer.getChannelData(0);
  const right = numChannels > 1 ? audioBuffer.getChannelData(1) : null;

  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
  const mp3Data = [];
  const blockSize = 1152;

  for (let i = 0; i < samples; i += blockSize) {
    const end = Math.min(i + blockSize, samples);
    const leftChunk = new Int16Array(end - i);
    let rightChunk = null;

    for (let j = i; j < end; j++) {
      leftChunk[j - i] = Math.max(-32768, Math.min(32767, Math.round(left[j] * 32767)));
    }

    if (right) {
      rightChunk = new Int16Array(end - i);
      for (let j = i; j < end; j++) {
        rightChunk[j - i] = Math.max(-32768, Math.min(32767, Math.round(right[j] * 32767)));
      }
    }

    const mp3buf = numChannels === 1
      ? mp3encoder.encodeBuffer(leftChunk)
      : mp3encoder.encodeBuffer(leftChunk, rightChunk);

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const end = mp3encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

export default function AudioConverter({ mode }) {
  useLang();
  const isWavToMp3 = mode === 'wav-to-mp3';
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [bitrate, setBitrate] = useState(192);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const acceptTypes = isWavToMp3 ? '.wav' : '.mp3';
  const outputExt = isWavToMp3 ? '.mp3' : '.wav';

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, MAX_FILES);
    setFiles(selected);
    setConverted([]);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files)
      .filter(f => f.name.match(isWavToMp3 ? /\.wav$/i : /\.mp3$/i))
      .slice(0, MAX_FILES);
    setFiles(dropped);
    setConverted([]);
    setError('');
  };

  const convertOne = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    const blob = isWavToMp3
      ? encodeMp3(audioBuffer, bitrate)
      : encodeWav(audioBuffer);

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      name: `${baseName}${outputExt}`,
      blob,
      originalSize: file.size,
      newSize: blob.size,
      url: URL.createObjectURL(blob),
    };
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError('');
    const results = [];
    for (const file of files) {
      try {
        const result = await convertOne(file);
        results.push(result);
      } catch (e) {
        setError(`${file.name}: ${e.message}`);
      }
    }
    if (results.length > 0) setConverted(results);
    setProcessing(false);
  };

  const handleDownload = (item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    a.click();
  };

  const handleDownloadAll = () => converted.forEach(handleDownload);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1>{t(isWavToMp3 ? 'audioconv_wavToMp3Title' : 'audioconv_mp3ToWavTitle')}</h1>
        <p>{t(isWavToMp3 ? 'audioconv_wavToMp3Desc' : 'audioconv_mp3ToWavDesc')}</p>
      </div>

      {isWavToMp3 && (
        <div className="format-selector">
          <label className="format-label">{t('audioconv_bitrate')}</label>
          <div className="format-options">
            {[128, 192, 256, 320].map(br => (
              <button
                key={br}
                className={`format-option ${bitrate === br ? 'active' : ''}`}
                onClick={() => { setBitrate(br); setConverted([]); }}
              >
                {br} kbps
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="file-upload-area"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="file-upload-label file-upload-large">
          <input type="file" accept={acceptTypes} multiple onChange={handleFiles} hidden />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <span>{files.length > 0 ? t('audioconv_filesSelected', { count: files.length }) : t('audioconv_upload')}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isWavToMp3 ? 'WAV' : 'MP3'}
          </span>
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {files.length > 0 && !converted.length && (
        <div className="webp-controls">
          <button className="convert-btn" onClick={handleConvert} disabled={processing} style={{ width: '100%', marginTop: 16 }}>
            {processing ? t('audioconv_converting') : t('audioconv_convertBtn', { count: files.length })}
          </button>
        </div>
      )}

      {converted.length > 0 && (
        <div className="webp-results">
          <div className="webp-summary">
            <span>{t('audioconv_converted', { count: converted.length })}</span>
          </div>

          <div className="webp-list">
            {converted.map((item, i) => (
              <div key={i} className="webp-item">
                <div className="webp-item-info" style={{ flex: 1 }}>
                  <span className="webp-item-name">{item.name}</span>
                  <span className="webp-item-sizes">
                    {formatSize(item.originalSize)} → {formatSize(item.newSize)}
                  </span>
                </div>
                <button className="copy-btn" onClick={() => handleDownload(item)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  {outputExt}
                </button>
              </div>
            ))}
          </div>

          {converted.length > 1 && (
            <button className="convert-btn" onClick={handleDownloadAll} style={{ width: '100%', marginTop: 12 }}>
              {t('audioconv_downloadAll')}
            </button>
          )}

          <button
            className="copy-btn"
            onClick={() => { setFiles([]); setConverted([]); }}
            style={{ marginTop: 12 }}
          >
            {t('audioconv_convertMore')}
          </button>
        </div>
      )}

      <div className="tool-info" style={{ marginTop: 40 }}>
        <h2>{t('audioconv_aboutTitle')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>MP3</h3>
            <p>{t('audioconv_aboutMp3')}</p>
          </div>
          <div className="info-card">
            <h3>WAV</h3>
            <p>{t('audioconv_aboutWav')}</p>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
          {t('audioconv_privacy')}
        </p>
      </div>
    </div>
  );
}
