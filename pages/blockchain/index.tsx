import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Modal, Button } from 'antd';
import BlockCard from '@/components/Blockchain/BlockCard';
import CompactBlockCard from '@/components/Blockchain/CompactBlockCard';
import { ArcherContainer, ArcherElement } from 'react-archer'; // Added react-archer imports
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

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);

  useEffect(() => {
    const newChain: BlockType[] = [];
    let previousHash = '0'.repeat(64);
    const precalculatedNonces = [6359, 19780, 10510, 13711, 36781];

    for (let i = 0; i < initialChainLength; i++) {
      const blockNumber = i + 1;
      const data = `Block ${blockNumber} Data`;
      const block = createInitialBlock(
        blockNumber,
        data,
        previousHash,
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
      } else {
        updatedChain[i].previousHash = '0'.repeat(64);
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return [...updatedChain];
  };

  const handleDataChange = (blockId: string, newData: string) => {
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;
      const newChain = [...prevChain];
      newChain[blockIndex] = { ...newChain[blockIndex], data: newData };
      const updatedFullChain = updateChainCascading(newChain, blockIndex);
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock(updatedFullChain[blockIndex]);
      }
      return updatedFullChain;
    });
  };

  const handleNonceChange = (blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;
      const newChain = [...prevChain];
      newChain[blockIndex] = { ...newChain[blockIndex], nonce: newNonce };
      const updatedFullChain = updateChainCascading(newChain, blockIndex);
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock(updatedFullChain[blockIndex]);
      }
      return updatedFullChain;
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
      let foundNonce = blockToMine.nonce;
      for (let i = 0; i <= MAX_NONCE; i++) {
        const hash = calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash);
        if (checkValidity(hash)) {
          foundNonce = i;
          break;
        }
      }
      newChain[blockIndex] = {...blockToMine, nonce: foundNonce};
      const finalChain = updateChainCascading(newChain, blockIndex);
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock(finalChain[blockIndex]);
      }
      setMiningStates(prev => ({...prev, [blockId]: false}));
      return finalChain;
    });
  }, [selectedBlock]);

  const showModal = (block: BlockType) => {
    setSelectedBlock(block);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
  };

  return (
    <>
      <Head>
        <title>{String(t('Blockchain', 'Blockchain'))} - {String(t('Blockchain Demo'))}</title>
      </Head>
      <div>
        <h1>{t('BlockchainViewTitle', 'Blockchain - Chain View')}</h1>
        <ArcherContainer strokeColor="grey" endMarker={false}> {/* strokeWidth default is 2, removed lineStyle */}
          <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', padding: '20px 5px', WebkitOverflowScrolling: 'touch' }}>
            {chain.map((block, index) => (
              <ArcherElement
                key={block.id}
                id={`block-${block.id}`}
                relations={index < chain.length - 1 ? [{
                  targetId: `block-${chain[index + 1].id}`,
                  targetAnchor: 'left',
                  sourceAnchor: 'right',
                  style: { strokeWidth: 3 }, // Solid, thicker line
                }] : undefined}
              >
                <div style={{ marginRight: '30px', marginLeft: '10px', flexShrink: 0 }}> {/* Added marginLeft and increased marginRight for spacing */}
                  <CompactBlockCard
                    blockNumber={block.blockNumber}
                    currentHash={block.currentHash}
                    previousHash={block.previousHash}
                    isValid={block.isValid}
                    onClick={() => showModal(block)}
                  />
                </div>
              </ArcherElement>
            ))}
          </div>
        </ArcherContainer>

        {selectedBlock && (
          <Modal
            title={`${t('BlockDetailsTitle', 'Block Details')} - ${t('Block', 'Block')} #${selectedBlock.blockNumber}`}
            visible={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            width={800}
            footer={[ <Button key="close" onClick={handleOk}> {t('CloseButton', 'Close')} </Button> ]}
          >
            <BlockCard
              blockNumber={selectedBlock.blockNumber}
              nonce={selectedBlock.nonce}
              data={selectedBlock.data}
              previousHash={selectedBlock.previousHash}
              currentHash={selectedBlock.currentHash}
              isValid={selectedBlock.isValid}
              onDataChange={(e) => handleDataChange(selectedBlock.id, e.target.value)}
              onNonceChange={(value) => handleNonceChange(selectedBlock.id, value)}
              onMine={() => handleMine(selectedBlock.id)}
              isMining={miningStates[selectedBlock.id] || false}
              isFirstBlock={selectedBlock.blockNumber === 1}
            />
          </Modal>
        )}
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
