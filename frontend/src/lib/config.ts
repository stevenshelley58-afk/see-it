export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

export const uploadBucketCdnBase =
  process.env.NEXT_PUBLIC_UPLOAD_CDN_BASE ?? '';

export const mockApiEnabled =
  (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'false').toLowerCase() === 'true';

export const mockPreviewPlaceholders = [
  'https://images.unsplash.com/photo-1616628182501-0bbcfd084d94?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=70'
];

