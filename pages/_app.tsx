import '@/styles/globals.css'
import 'antd/dist/reset.css'; // Import Ant Design CSS
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router';
import AppLayout from '@/components/Layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { appWithTranslation } from 'next-i18next';
import nextI18NextConfig from '../next-i18next.config.js';

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.route}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
