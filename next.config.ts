import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/**': ['./data/portfolio.json'],
  },
};

export default nextConfig;
