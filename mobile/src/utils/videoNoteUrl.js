import { getBaseUrl } from '../services/api';

/**
 * Полный URL файла кружочка (как в MessageItem).
 */
export function resolveVideoNoteSourceUrl(fileUrl) {
  if (!fileUrl) return fileUrl;
  let u = fileUrl;
  if (u.startsWith('http')) {
    if (u.includes('polka-production.up.railway.app') && u.startsWith('http://')) {
      return u.replace('http://', 'https://');
    }
    return u;
  }
  // Внимание: файлы только под /uploads/ на Railway исчезают после деплоя (эфемерный диск).
  if (u.startsWith('/uploads/')) {
    return `https://polka-production.up.railway.app${u}`;
  }
  const base = getBaseUrl();
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

/**
 * URL для воспроизведения: Safari/iOS не умеют WebM, Cloudinary отдаёт MP4 по f_mp4.
 * См. https://cloudinary.com/documentation/video_manipulation_and_delivery
 */
export function getVideoNotePlaybackUrl(resolvedUrl) {
  if (!resolvedUrl || typeof resolvedUrl !== 'string') return resolvedUrl;
  if (!resolvedUrl.includes('res.cloudinary.com')) return resolvedUrl;
  if (!resolvedUrl.includes('/video/upload/')) return resolvedUrl;
  // Уже есть конвертация в MP4 (в т.ч. цепочка ...q_auto,f_mp4...)
  if (resolvedUrl.includes('f_mp4')) return resolvedUrl;
  return resolvedUrl.replace('/video/upload/', '/video/upload/f_mp4/');
}

export function getVideoNotePlaybackUrlFromMessage(fileUrl) {
  return getVideoNotePlaybackUrl(resolveVideoNoteSourceUrl(fileUrl));
}
