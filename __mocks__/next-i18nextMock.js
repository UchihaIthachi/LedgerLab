module.exports = {
  useTranslation: () => {
    return {
      t: (str, options) => {
        if (options && options.val) {
          // Simple interpolation mock
          return str.replace('{{val}}', options.val);
        }
        return str;
      },
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'en',
      },
    };
  },
  serverSideTranslations: jest.fn().mockResolvedValue({}),
};
