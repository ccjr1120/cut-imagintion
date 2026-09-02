import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/**': ['./data/portfolio.json'],
  },
  // Uploaded media lives in the persistent shared directory in production.
  // Keep local test media out of the standalone deployment artifact.
  outputFileTracingExcludes: {
    '/**': ['./storage/media/**/*'],
  },
};

export default nextConfig;
