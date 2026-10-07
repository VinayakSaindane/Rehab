/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Set to false to avoid double canvas/camera initialization in dev
  transpilePackages: ['@rehabsense/exercise-engine', '@rehabsense/types', '@rehabsense/config'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
