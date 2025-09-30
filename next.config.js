/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Durante il build di produzione, ignora gli errori ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Durante il build di produzione, ignora gli errori TypeScript
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
