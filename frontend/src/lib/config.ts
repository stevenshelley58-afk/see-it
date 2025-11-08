function readEnv(name: string, fallback: string | null = null) {
  const value = process.env[name];
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length === 0 ? fallback : trimmed;
}

export const backendBaseUrl = readEnv('NEXT_PUBLIC_BACKEND_URL', 'http://localhost:8080')!;

export const uploadBucketCdnBase = readEnv('NEXT_PUBLIC_UPLOAD_CDN_BASE', '') ?? '';

export const mockApiEnabled =
  (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'false').toLowerCase() === 'true';

export const gaMeasurementId = readEnv('NEXT_PUBLIC_GA4_MEASUREMENT_ID');
export const segmentWriteKey = readEnv('NEXT_PUBLIC_SEGMENT_WRITE_KEY');

export const mockPreviewPlaceholders = [
  'https://images.unsplash.com/photo-1616628182501-0bbcfd084d94?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=70'
];

