// @ts-check

/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  // https://www.i18next.com/overview/configuration-options#logging
  debug: process.env.NODE_ENV === 'development',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'es', 'fr-CA', 'fr-FR', 'hi', 'hu', 'id', 'ja', 'ko', 'nl', 'pl', 'pt', 'zh-CN'],
  },
  /** To avoid issues when deploying to some paas (vercel...) */
  localePath:
    typeof window === 'undefined'
      ? require('path').resolve('./public/locales')
      : '/locales',

  reloadOnPrerender: process.env.NODE_ENV === 'development',

  /**
   * @link https://github.com/i18next/next-i18next#6-advanced-configuration
   */
  // saveMissing: false, // Recommended false in production
  // strictMode: true,
  // serializeConfig: false,
  // react: { useSuspense: false } // Not needed for Next.js 13+
};
