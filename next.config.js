/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'media.bamakopodcast.studio', // Add this in case real images are hosted on Cloudflare R2 based on backend env
      },
      // You can add more domains if needed
    ],
  },
};

module.exports = nextConfig;
