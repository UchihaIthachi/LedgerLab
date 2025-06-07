/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'es', 'fr-CA', 'fr-FR', 'hi', 'hu', 'id', 'ja', 'ko', 'nl', 'pl', 'pt', 'zh-CN'],
  },
}

module.exports = nextConfig
