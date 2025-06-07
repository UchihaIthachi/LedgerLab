import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Home.module.css'; // Keep for .main and potentially .center
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps, InferGetStaticPropsType } from 'next';
import { Card, Row, Col, Typography } from 'antd';
import { AppstoreOutlined, KeyOutlined, LockOutlined } from '@ant-design/icons'; // Using LockOutlined for ZKP
import { motion } from 'framer-motion';

const { Title, Paragraph } = Typography;

// Animation Variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Time delay between each child animation
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type Props = {
  // Add custom props here if needed
};

export default function Home(_props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { t } = useTranslation('common');

  const demoSections = [
    {
      href: '/blockchain',
      icon: <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      titleKey: 'BlockchainDemoCardTitle',
      defaultTitle: 'Blockchain Demo',
      textKey: 'BlockchainDemoCardText',
      defaultText: 'Explore fundamental blockchain concepts like hashing, blocks, and chain validity through interactive examples.',
    },
    {
      href: '/public-private-key',
      icon: <KeyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      titleKey: 'PublicPrivateKeyCardTitle',
      defaultTitle: 'Public/Private Keys & Signing',
      textKey: 'PublicPrivateKeyCardText',
      defaultText: 'Understand digital signatures, key pair generation, and transaction signing in a simplified manner.',
    },
    {
      href: '/zero-knowledge-proof',
      icon: <LockOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
      titleKey: 'ZeroKnowledgeProofCardTitle',
      defaultTitle: 'Zero Knowledge Proofs',
      textKey: 'ZKPPageDescription', // Re-using existing translation key from ZKP page for consistency
      defaultText: 'Learn about Zero-Knowledge Proofs using an interactive map coloring example to prove knowledge without revealing secrets.',
    },
  ];

  return (
    <>
      <Head>
        <title>{String(t('Blockchain Demo', 'Blockchain Demo'))}</title>
        <meta name="description" content={String(t('MetaDescription', 'Interactive Blockchain Demonstrations'))} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Title level={1} style={{ marginBottom: '16px' }}>
              {t('WelcomeMessage', 'Welcome to the Blockchain Demo')}
            </Title>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paragraph style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto' }}>
              {t('HomePageIntro', 'Explore various blockchain concepts through our interactive demonstrations. Click on a card below to get started!')}
            </Paragraph>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[24, 24]} justify="center">
            {demoSections.map((section) => (
              <Col key={section.href} xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                <motion.div
                  variants={itemVariants}
                  style={{ width: '100%', cursor: 'pointer' }}
                  whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.2 } }}
                >
                  <Link href={section.href} passHref style={{ width: '100%' }}>
                    <Card
                      hoverable
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}
                      bodyStyle={{ flexGrow: 1 }}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {section.icon}
                          <span style={{ marginLeft: '12px', fontSize: '1.1em' }}>{t(section.titleKey, section.defaultTitle)}</span>
                        </div>
                      }
                    >
                      <Paragraph>{t(section.textKey, section.defaultText)}</Paragraph>
                    </Card>
                  </Link>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
