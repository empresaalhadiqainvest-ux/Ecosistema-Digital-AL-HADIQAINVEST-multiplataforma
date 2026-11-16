/**
 * Parses user-provided streaming links into responsive, secure embed URLs.
 * Optimized for AL-HADIQA INVEST official channel (www.youtube.com/@AL-HADIQAINVEST)
 * Supports:
 * - YouTube Live & Videos (watch, youtu.be, /live/ID, @AL-HADIQAINVEST/live, embed)
 * - Twitch (channels, streams)
 * - Facebook Live
 * - Vimeo
 * - Direct iframe / WebRTC streams
 */
export function parseStreamEmbedUrl(rawUrl: string): {
  embedUrl: string;
  source: 'youtube' | 'tiktok' | 'twitch' | 'facebook' | 'vimeo' | 'webrtc' | 'custom';
  videoId?: string;
  isChannelLive?: boolean;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { embedUrl: '', source: 'custom' };
  }

  let trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // Bloqueo estricto contra inyecciones javascript:, data:, vbscript:
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.includes('<script')
  ) {
    return { embedUrl: '', source: 'custom' };
  }

  // Forzar cifrado TLS/HTTPS en enlaces de transmisión
  if (lower.startsWith('http://')) {
    trimmed = trimmed.replace(/^http:\/\//i, 'https://');
  }

  // WebRTC direct indicator
  if (trimmed.startsWith('webrtc://') || trimmed === 'webrtc_direct') {
    return { embedUrl: 'webrtc_direct', source: 'webrtc' };
  }

  // Bare 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${trimmed}?autoplay=1&rel=0&modestbranding=1`,
      source: 'youtube',
      videoId: trimmed,
    };
  }

  // YouTube Watch, youtu.be, embed, or /live/VIDEO_ID
  const ytVideoMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytVideoMatch && ytVideoMatch[1]) {
    const videoId = ytVideoMatch[1];
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      source: 'youtube',
      videoId,
    };
  }

  // Official Channel: www.youtube.com/@AL-HADIQAINVEST or @AL-HADIQAINVEST/live
  if (trimmed.includes('@AL-HADIQAINVEST') || trimmed.includes('@al-hadiqainvest')) {
    // If it's the live URL of the channel
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=UC_AL_HADIQA_INVEST&autoplay=1&rel=0`,
      source: 'youtube',
      isChannelLive: true,
    };
  }

  // General YouTube Channel Live Stream
  const ytChannelMatch = trimmed.match(/youtube\.com\/(?:channel\/|c\/|@)([a-zA-Z0-9_.-]+)/);
  if (trimmed.includes('youtube.com') && ytChannelMatch) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=${ytChannelMatch[1]}&autoplay=1&rel=0`,
      source: 'youtube',
      isChannelLive: true,
    };
  }

  // TikTok Video (/video/ID) or TikTok Channel / Live (@alhadiqa.capital)
  const tiktokVideoMatch = trimmed.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (tiktokVideoMatch && tiktokVideoMatch[1]) {
    const videoId = tiktokVideoMatch[1];
    return {
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      source: 'tiktok',
      videoId,
    };
  }

  if (lower.includes('tiktok.com')) {
    return {
      embedUrl: trimmed.includes('/live') ? trimmed : `${trimmed.replace(/\/+$/, '')}/live`,
      source: 'tiktok',
      isChannelLive: true,
    };
  }

  // Twitch Channel
  const twitchMatch = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch && twitchMatch[1]) {
    const channel = twitchMatch[1];
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return {
      embedUrl: `https://player.twitch.tv/?channel=${channel}&parent=${hostname}&parent=localhost&parent=ais-dev-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app&parent=ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app&autoplay=true`,
      source: 'twitch',
    };
  }

  // Facebook Live / Video
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    const encoded = encodeURIComponent(trimmed);
    return {
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true`,
      source: 'facebook',
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      source: 'vimeo',
    };
  }

  // Fallback: return as-is
  return {
    embedUrl: trimmed,
    source: 'custom',
  };
}
