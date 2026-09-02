/**
 * Helper untuk me-resolve URL media gambar & avatar dari backend atau fallback generator.
 */
export const resolveMediaUrl = (url?: string, fallbackName: string = 'User'): string => {
  if (!url || url.trim() === '') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=946D6D&color=fff&bold=true`;
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:5000${cleanPath}`;
};
