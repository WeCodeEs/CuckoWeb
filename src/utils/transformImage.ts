const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin' | 'avif' | 'webp';
}

export function transformImage(
  url: string | null | undefined,
  options: TransformOptions,
): string | null {
  if (!url || !SUPABASE_URL) return url ?? null;

  // Only transform Supabase Storage URLs (not blob:, data:, or external URLs)
  if (!url.startsWith(SUPABASE_URL) || !url.includes('/storage/v1/object/')) return url;

  // Build the render URL by replacing /object/ with /object/render/image/
  // If it's a signed URL (contains /object/sign/), replace /sign/ with /render/image/sign/
  let renderUrl: string;
  if (url.includes('/object/sign/')) {
    renderUrl = url.replace('/storage/v1/object/sign/', '/storage/v1/render/image/sign/');
  } else if (url.includes('/object/public/')) {
    renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  } else {
    return url;
  }

  const separator = renderUrl.includes('?') ? '&' : '?';
  const params: string[] = [];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.resize) params.push(`resize=${options.resize}`);
  if (options.format) params.push(`format=${options.format}`);

  if (params.length === 0) return url;

  return `${renderUrl}${separator}${params.join('&')}`;
}

export const IMAGE_PRESETS = {
  thumbnail: { width: 80, height: 80, quality: 60, resize: 'cover' as const, format: 'webp' as const },
  productPreview: { width: 500, quality: 75, resize: 'cover' as const, format: 'webp' as const },
  bannerCard: { width: 600, quality: 70, resize: 'cover' as const, format: 'webp' as const },
  bannerFull: { width: 1200, quality: 85, resize: 'contain' as const, format: 'webp' as const },
} as const;
