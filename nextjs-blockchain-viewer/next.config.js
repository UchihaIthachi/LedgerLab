const withPWA = require('next-pwa')({
  dest: 'public', // Destination directory for service worker files
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting phase and activate new service worker immediately
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'es', 'fr-CA', 'fr-FR', 'hi', 'hu', 'id', 'ja', 'ko', 'nl', 'pl', 'pt', 'zh-CN'],
  },
  // Add other Next.js configurations here if needed in the future
};

module.exports = withPWA(nextConfig);
