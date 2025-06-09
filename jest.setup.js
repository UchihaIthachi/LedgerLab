// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn()
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null)
    };
  }
}));

// Mock next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...props) => {
    const dynamicModule = jest.requireActual('next/dynamic');
    const dynamicActualComp = dynamicModule.default;
    const RequiredComponent = dynamicActualComp(props[0]);
    RequiredComponent.preload
      ? RequiredComponent.preload()
      : RequiredComponent.render.preload();
    return RequiredComponent;
  },
}));

// Mock next-i18next
// jest.mock('next-i18next', () => ({
//   useTranslation: () => {
//     return {
//       t: (str) => str,
//       i18n: {
//         changeLanguage: () => new Promise(() => {}),
//       },
//     };
//   },
//   // If you have server-side translations, mock serverSideTranslations as well
//   serverSideTranslations: jest.fn().mockResolvedValue({}),
// }));

// Mock Framer Motion
jest.mock('framer-motion', () => {
  const FakeTransition = jest.fn(({ children }) => children);
  const FakeAnimatePresence = jest.fn(({ children }) => children);
  const motion = {
    div: jest.fn(({ children }) => children),
    span: jest.fn(({ children }) => children),
    // Add other HTML elements you use with motion here
  };
  motion.div.attrs = jest.fn(() => ({})); // If you use .attrs

  return {
    __esModule: true,
    motion: motion,
    AnimatePresence: FakeAnimatePresence,
    Transition: FakeTransition,
  };
});
