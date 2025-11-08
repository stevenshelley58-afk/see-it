import type { NextConfig } from 'next';

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'cdn.shopify.com' },
  { protocol: 'https', hostname: 'cdn.shopifycdn.net' },
  { protocol: 'https', hostname: 'files.shopifycdn.com' },
  { protocol: 'https', hostname: 'storage.googleapis.com' }
];

const uploadCdnBase = process.env.NEXT_PUBLIC_UPLOAD_CDN_BASE;
if (uploadCdnBase) {
  try {
    const url = new URL(uploadCdnBase);
    const hostname = url.hostname;
    const protocol = (url.protocol.replace(':', '') || 'https') as 'http' | 'https';
    if (!remotePatterns.some((pattern) => pattern.hostname === hostname)) {
      remotePatterns.push({ protocol, hostname });
    }
  } catch {
    // Ignore invalid CDN URLs
  }
}

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns
  }
};

export default nextConfig;
