import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { List, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const PKIndexPage: NextPage = () => {
  const { t } = useTranslation('common');

  const features = [
    { name: t('KeysFeatureName', 'Key Pair Generation'), path: '/public-private-key/keys', description: t('KeysFeatureDescription', 'Generate and understand secp256k1 public/private key pairs.') },
    { name: t('SignaturesFeatureName', 'Digital Signatures'), path: '/public-private-key/signatures', description: t('SignaturesFeatureDescription', 'Sign messages and verify digital signatures.') },
    { name: t('TransactionSigningFeatureName', 'Transaction Signing (Coming Soon)'), path: '/public-private-key/transaction', description: t('TransactionSigningFeatureDescription', 'See how private keys are used to sign and authorize transactions.') },
  ];

  return (
    <>
      <Head>
        <title>{t('PPKSectionTitle', 'Public/Private Key Cryptography')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <Title level={2}>{t('PPKSectionTitle', 'Public/Private Key Cryptography')}</Title>
        <Paragraph>
          {t('PPKSectionDescription', 'This section explores fundamental concepts of public-key cryptography, which is essential for securing communications and transactions in systems like blockchains.')}
        </Paragraph>
        <List
          itemLayout="horizontal"
          dataSource={features}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<Link href={item.path}>{item.name}</Link>}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default PKIndexPage;
