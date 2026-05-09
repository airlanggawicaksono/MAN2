/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:2385";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: `${backendUrl}/docs`,
      },
      {
        source: "/docs/:path*",
        destination: `${backendUrl}/docs/:path*`,
      },
      {
        source: "/openapi.json",
        destination: `${backendUrl}/openapi.json`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/desktop/:path*",
        destination: `${backendUrl}/api/desktop/:path*`,
      },
    ];
  },
};

export default nextConfig;
