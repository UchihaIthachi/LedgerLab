import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

const PKTransactionPage: NextPage = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('TransactionSigningTitle', 'Transaction Signing')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <h1>{t('TransactionSigningPageTitle', 'Public/Private Key - Transaction Signing')}</h1>
        <p>{t('ComingSoon', 'This view will demonstrate signing blockchain transactions.')}</p>
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default PKTransactionPage;
