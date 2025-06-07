import Head from 'next/head'
import Image from 'next/image'
// import { Inter } from 'next/font/google' // Removing font for simplicity for now
import styles from '@/styles/Home.module.css'
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';

// const inter = Inter({ subsets: ['latin'] }) // Removing font

type Props = {
  // Add custom props here if needed
}

export default function Home(_props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{String(t('Blockchain Demo', 'Blockchain Demo'))}</title>
        <meta name="description" content={t('MetaDescription', 'Interactive Blockchain Demonstrations')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <main className={`${styles.main} ${inter.className}`}> */}
      <main className={styles.main}>
        <div className={styles.description}>
          <p>
            {t('GetStartedByEditing', 'Get started by editing')}&nbsp;
            <code className={styles.code}>pages/index.tsx</code>
          </p>
          <div>
            <a
              href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              By{' '}
              <Image
                src="/vercel.svg"
                alt="Vercel Logo"
                className={styles.vercelLogo}
                width={100}
                height={24}
              />
            </a>
          </div>
        </div>

        <div className={styles.center}>
          <h1>{t('WelcomeMessage', 'Welcome to the Blockchain Demo')}</h1>
        </div>

        <div className={styles.grid}>
          <a
            href="#" // Update link later
            className={styles.card}
          >
            <h2>
              {t('BlockchainDemoCardTitle', 'Blockchain Demo')} <span>-&gt;</span>
            </h2>
            <p>
              {t('BlockchainDemoCardText', 'Explore fundamental blockchain concepts.')}
            </p>
          </a>

          <a
            href="#" // Update link later
            className={styles.card}
          >
            <h2>
              {t('PublicPrivateKeyCardTitle', 'Public/Private Keys')} <span>-&gt;</span>
            </h2>
            <p>
              {t('PublicPrivateKeyCardText', 'Understand digital signatures and key pairs.')}
            </p>
          </a>

          <a
            href="#" // Update link later
            className={styles.card}
          >
            <h2>
              {t('ZeroKnowledgeProofCardTitle', 'Zero Knowledge Proofs')} <span>-&gt;</span>
            </h2>
            <p>
              {t('ZeroKnowledgeProofCardText', 'Learn about ZKPs through an interactive example.')}
            </p>
          </a>
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'common',
    ])),
  },
})
