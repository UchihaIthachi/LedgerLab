import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import BlockCard from '@/components/Blockchain/BlockCard';
import { calculateHash, checkValidity, DIFFICULTY, MAX_NONCE } from '@/lib/blockchainUtils'; // Import utilities
import { Row, Col, Typography } from 'antd'; // Added Typography
import { AppstoreOutlined } from '@ant-design/icons'; // Added AppstoreOutlined

const { Title } = Typography; // Destructure Title

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
  const [miningAttemptNonce, setMiningAttemptNonce] = useState<number | null>(null);
  const [miningAttemptHash, setMiningAttemptHash] = useState<string | null>(null);

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
    setMiningAttemptNonce(0); // Initialize
    setMiningAttemptHash(calculateHash(blockNumber, 0, data, previousHash)); // Initial hash attempt
    await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI update

    let newNonceAttempt = 0;
    while (newNonceAttempt <= MAX_NONCE) {
      const hash = calculateHash(blockNumber, newNonceAttempt, data, previousHash);
      if (checkValidity(hash)) {
        setNonce(newNonceAttempt);
        setIsMining(false);
        setMiningAttemptNonce(null); // Clear on success
        setMiningAttemptHash(null);  // Clear on success
        return;
      }
      // Update progress periodically
      if (newNonceAttempt % 200 === 0) { // Update UI more frequently for attempts
        setMiningAttemptNonce(newNonceAttempt);
        setMiningAttemptHash(hash);
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield to update UI
      }
      newNonceAttempt++;
    }
    setIsMining(false);
    setMiningAttemptNonce(null); // Clear if not found
    setMiningAttemptHash(null);  // Clear if not found
  }, [blockNumber, data, previousHash]); // Dependencies for mining logic


  return (
    <>
      <Head>
        <title>{String(t('Block', 'Block'))} - {String(t('Blockchain Demo'))}</title>
      </Head>
      <div>
        <Title level={1} style={{ marginBottom: '24px' }}>
          <AppstoreOutlined style={{ marginRight: '12px' }} />
          {t('BlockViewTitle', 'Blockchain - Single Block View')}
        </Title>
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
              miningAttemptNonce={miningAttemptNonce ?? undefined} // Pass as undefined if null
              miningAttemptHash={miningAttemptHash ?? undefined}   // Pass as undefined if null
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
