import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import BlockCard from '@/components/Blockchain/BlockCard';
import { calculateHash, checkValidity, DIFFICULTY, MAX_NONCE } from '@/lib/blockchainUtils'; // Import utilities
import { Row, Col } from 'antd';

const BlockPage: NextPage = () => {
  const { t } = useTranslation('common');

  const [blockNumber, setBlockNumber] = useState<number>(1);
  // Nonce is primarily numeric for calculations, BlockCard can adapt string|number for input display
  const [nonce, setNonce] = useState<number>(0);
  const [data, setData] = useState<string>('');
  // For single block view, previousHash is conceptually fixed or non-existent
  const [previousHash, setPreviousHash] = useState<string>('0'.repeat(64));
  const [currentHash, setCurrentHash] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isMining, setIsMining] = useState<boolean>(false);

  // Memoized hash calculation using the utility function
  const memoizedCalculateHash = useCallback((currentNonce: number, currentData: string) => {
    return calculateHash(blockNumber, currentNonce, currentData, previousHash);
  }, [blockNumber, previousHash]); // Only re-memoize if blockNumber or previousHash changes (stable in this view)

  useEffect(() => {
    const hash = memoizedCalculateHash(nonce, data);
    setCurrentHash(hash);
    setIsValid(checkValidity(hash));
  }, [nonce, data, memoizedCalculateHash]);

  const handleNonceChange = (value: string | number | null | undefined) => {
    setNonce(Number(value ?? 0)); // Ensure nonce is a number for state
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setData(e.target.value);
  };

  const handleMine = useCallback(async () => {
    setIsMining(true);
    await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI update

    let newNonceAttempt = 0;
    while (newNonceAttempt <= MAX_NONCE) {
      const hash = calculateHash(blockNumber, newNonceAttempt, data, previousHash);
      if (checkValidity(hash)) {
        setNonce(newNonceAttempt);
        // setCurrentHash(hash); // Will be updated by useEffect
        // setIsValid(true);  // Will be updated by useEffect
        setIsMining(false);
        return;
      }
      if (newNonceAttempt % 2000 === 0) { // Yield more sparsely
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      newNonceAttempt++;
    }
    setIsMining(false);
  }, [blockNumber, data, previousHash]); // Dependencies for mining logic


  return (
    <>
      <Head>
        <title>{t('Block', 'Block')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <h1>{t('BlockViewTitle', 'Blockchain - Single Block View')}</h1>
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <BlockCard
              blockNumber={blockNumber}
              nonce={nonce} // Pass number directly
              data={data}
              previousHash={previousHash}
              currentHash={currentHash}
              isValid={isValid}
              onDataChange={handleDataChange}
              onNonceChange={handleNonceChange} // BlockCard's InputNumber handles string/number
              onMine={handleMine}
              isMining={isMining}
              isFirstBlock={true}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default BlockPage;
