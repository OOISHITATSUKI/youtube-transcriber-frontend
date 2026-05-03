// Client-side YouTube transcript fetcher
// Uses server proxy for InnerTube API (CORS blocks direct browser access)

const API_URL = import.meta.env.VITE_API_URL || '';

const VIDEO_ID_REGEX = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url) {
  const match = url.match(VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

export async function fetchTranscriptClientSide(url, maxSeconds = null) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  // Fetch player data via server proxy (avoids CORS)
  const playerRes = await fetch(`${API_URL}/api/innertube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  });

  if (!playerRes.ok) {
    const err = await playerRes.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get video info');
  }

  const playerData = await playerRes.json();

  const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('この動画には字幕がありません');
  }

  // Select best track
  const selectedTrack =
    captionTracks.find(t => t.languageCode === 'ja') ||
    captionTracks.find(t => t.kind === 'asr') ||
    captionTracks.find(t => t.languageCode === 'en') ||
    captionTracks[0];

  // Fetch transcript XML via proxy
  const transcriptRes = await fetch(`${API_URL}/api/innertube/captions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: selectedTrack.baseUrl }),
  });
  const xmlText = await transcriptRes.text();
  if (!xmlText) throw new Error('Failed to fetch transcript data');

  // Parse XML
  const segments = parseTranscriptXML(xmlText);
  if (segments.length === 0) throw new Error('この動画には字幕がありません');

  const title = playerData?.videoDetails?.title || `YouTube Video (${videoId})`;
  const duration = parseInt(playerData?.videoDetails?.lengthSeconds || '0') ||
    Math.ceil((segments[segments.length - 1].offset + segments[segments.length - 1].duration) / 1000);

  // Truncate for free users
  const filtered = maxSeconds
    ? segments.filter(seg => (seg.offset / 1000) <= maxSeconds)
    : segments;

  // Format transcript
  const transcript = filtered.map(seg => {
    const totalSec = Math.floor(seg.offset / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}] ${seg.text}`;
  }).join('\n');

  return {
    transcript,
    duration,
    title,
    isTruncated: maxSeconds ? duration > maxSeconds : false,
    lang: selectedTrack.languageCode || 'auto',
    rawSegments: filtered,
  };
}

function parseTranscriptXML(xmlText) {
  const segments = [];

  // Format 1: <text start="..." dur="...">text</text>
  const regex1 = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  let match;
  while ((match = regex1.exec(xmlText)) !== null) {
    const text = decodeEntities(match[3]);
    if (text) segments.push({ offset: parseFloat(match[1]) * 1000, duration: parseFloat(match[2]) * 1000, text });
  }

  // Format 2: <p t="..." d="..."><s>text</s></p>
  if (segments.length === 0) {
    const regex2 = /<p t="(\d+)"(?: d="(\d+)")?[^>]*><s[^>]*>([^<]*)<\/s><\/p>/g;
    while ((match = regex2.exec(xmlText)) !== null) {
      const text = decodeEntities(match[3]);
      if (text) segments.push({ offset: parseInt(match[1]), duration: parseInt(match[2] || '0'), text });
    }
  }

  return segments;
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n/g, ' ')
    .trim();
}
