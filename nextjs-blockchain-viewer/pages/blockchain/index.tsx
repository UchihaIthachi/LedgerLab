import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Row, Col, Space } from 'antd';
import BlockCard from '@/components/Blockchain/BlockCard';
import {
  BlockType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from '@/lib/blockchainUtils';

const initialChainLength = 5;

const BlockchainIndexPage: NextPage = () => {
  const { t } = useTranslation('common');
  const [chain, setChain] = useState<BlockType[]>([]);
  const [miningStates, setMiningStates] = useState<{[key: string]: boolean}>({});


  // Initialize chain
  useEffect(() => {
    const newChain: BlockType[] = [];
    let previousHash = '0'.repeat(64);
    // Pre-calculated nonces for simple data to speed up initialization
    // These would need to be found if data or DIFFICULTY changes
    const precalculatedNonces = [6359, 19780, 10510, 13711, 36781]; // Example for empty data

    for (let i = 0; i < initialChainLength; i++) {
      const blockNumber = i + 1;
      const data = `Block ${blockNumber} Data`; // Simple initial data
      // For more complex initial data, mining might be needed or nonces pre-calculated
      const block = createInitialBlock(
        blockNumber,
        data, // Use simple data for faster init
        previousHash,
        // Use pre-calculated nonce if data is known and simple, otherwise let createInitialBlock mine
        data === `Block ${blockNumber} Data` ? precalculatedNonces[i] : undefined
      );
      newChain.push(block);
      previousHash = block.currentHash;
    }
    setChain(newChain);
  }, []);

  const updateChainCascading = (updatedChain: BlockType[], startIndex: number): BlockType[] => {
    for (let i = startIndex; i < updatedChain.length; i++) {
      if (i > 0) {
        updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return [...updatedChain]; // Return new array to trigger re-render
  };


  const handleDataChange = (blockId: string, newData: string) => {
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;

      const newChain = [...prevChain];
      newChain[blockIndex] = { ...newChain[blockIndex], data: newData };
      // No need to update hash/validity here, updateChainCascading will do it from this block onwards
      return updateChainCascading(newChain, blockIndex);
    });
  };

  const handleNonceChange = (blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;

      const newChain = [...prevChain];
      newChain[blockIndex] = { ...newChain[blockIndex], nonce: newNonce };
      return updateChainCascading(newChain, blockIndex);
    });
  };

  const handleMine = useCallback(async (blockId: string) => {
    setMiningStates(prev => ({...prev, [blockId]: true}));
    await new Promise(resolve => setTimeout(resolve, 0));


    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) {
        setMiningStates(prev => ({...prev, [blockId]: false}));
        return prevChain;
      }

      const newChain = [...prevChain];
      const blockToMine = newChain[blockIndex];

      let foundNonce = blockToMine.nonce; // Start with current nonce if desired, or 0
      for (let i = 0; i <= MAX_NONCE; i++) {
        const hash = calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash);
        if (checkValidity(hash)) {
          foundNonce = i;
          break;
        }
      }
      newChain[blockIndex] = {...blockToMine, nonce: foundNonce};
      const finalChain = updateChainCascading(newChain, blockIndex);
      setMiningStates(prev => ({...prev, [blockId]: false}));
      return finalChain;
    });
  }, []);


  return (
    <>
      <Head>
        <title>{t('Blockchain', 'Blockchain')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <h1>{t('BlockchainViewTitle', 'Blockchain - Chain View')}</h1>
        <Space direction="vertical" style={{ width: '100%' }}>
          {chain.map((block, index) => (
            <Row key={block.id} justify="center">
              <Col xs={24} sm={20} md={16} lg={12} xl={10}>
                <BlockCard
                  blockNumber={block.blockNumber}
                  nonce={block.nonce}
                  data={block.data}
                  previousHash={block.previousHash}
                  currentHash={block.currentHash}
                  isValid={block.isValid}
                  onDataChange={(e) => handleDataChange(block.id, e.target.value)}
                  onNonceChange={(value) => handleNonceChange(block.id, value)}
                  onMine={() => handleMine(block.id)}
                  isMining={miningStates[block.id] || false}
                  isFirstBlock={index === 0}
                />
              </Col>
            </Row>
          ))}
        </Space>
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default BlockchainIndexPage;
