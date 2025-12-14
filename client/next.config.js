/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_DISABLE_SIGNUP: process.env.NEXT_PUBLIC_DISABLE_SIGNUP,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version
  },
  // Disable SSL verification for self-signed certificates in production
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configure webpack to handle server-side fetch with custom agent
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to ignore SSL certificate errors
      // This is only for self-hosted environments with self-signed certificates
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    return config;
  },
};

module.exports = nextConfig;
