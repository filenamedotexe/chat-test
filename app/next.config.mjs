/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "assets.aceternity.com" }],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
