export interface VideoInfo {
  type: 'youtube' | 'direct' | 'unsupported';
  embedUrl?: string;
  directUrl?: string;
}

export function parseVideoUrl(url: string): VideoInfo {
  if (!url) return { type: 'unsupported' };
  const trimmed = url.trim();

  // YouTube Shorts or standard YouTube
  // e.g. https://www.youtube.com/watch?v=XXXX or https://youtu.be/XXXX or https://www.youtube.com/shorts/XXXX
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    };
  }

  // Direct video file or generic URL
  if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(trimmed)) {
    return {
      type: 'direct',
      directUrl: trimmed
    };
  }

  // Default to direct if it looks like an http/https url
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'direct',
      directUrl: trimmed
    };
  }

  return { type: 'unsupported' };
}
