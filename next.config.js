/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3t3ozftmdmh3i.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'media.rss.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'media.bamakopodcast.studio', // Add this in case real images are hosted on Cloudflare R2 based on backend env
      },
      {
        protocol: 'https',
        hostname: 'pub-9e8cf5e18f734f4584bf285385e6b99c.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'media.rss.com',
      },
      // You can add more domains if needed
    ],
  },
};

module.exports = nextConfig;
