/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa');

const runtimeCaching = [
    {
        urlPattern: /\.(?:jpg|jpeg|png|gif|svg|ico|webp)$/i,
        handler: 'CacheFirst',
        options: {
            cacheName: 'static-images',
            expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            },
        },
    },
    {
        urlPattern: /\.(?:mp4|webm|mp3|wav|ogg)$/i,
        handler: 'CacheFirst',
        options: {
            cacheName: 'static-media',
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            },
            rangeRequests: true, // Important for media files
        },
    },
    {
        urlPattern: /^https:\/\/drive\.google\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
            cacheName: 'google-drive-media',
            expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
            rangeRequests: true, // Enable range requests for videos from GDrive
            cacheableResponse: {
                statuses: [0, 200],
            },
        },
    },
     {
        urlPattern: /^https:\/\/(images\.unsplash|picsum\.photos|placehold\.co)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
            cacheName: 'remote-images',
            expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
            cacheableResponse: {
                statuses: [0, 200],
            },
        },
    },
];

const pwaWrapper = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching,
  }
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = pwaWrapper(nextConfig);
