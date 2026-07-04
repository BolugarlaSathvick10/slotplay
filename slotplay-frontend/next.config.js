/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode highlights potential issues early
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // Allow serving images from the backend (local dev)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      // Cloudinary (v2)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // Forward /api calls to the backend during development
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
