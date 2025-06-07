import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Row, Col, Typography, Space, Modal, Button as AntButton } from 'antd'; // Added Modal, AntButton
import BlockCard from '@/components/Blockchain/BlockCard';
import CompactBlockCard from '@/components/Blockchain/CompactBlockCard'; // Added CompactBlockCard
import {
  BlockType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from '@/lib/blockchainUtils';

const { Title } = Typography;

const initialChainLength = 5;
const peerIds = ['Peer A', 'Peer B', 'Peer C'];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

const DistributedPage: NextPage = () => {
  const { t } = useTranslation('common');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{[key: string]: boolean}>({});

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  useEffect(() => {
    const newPeers: Peer[] = peerIds.map(id => {
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
      return { peerId: id, chain: newChain };
    });
    setPeers(newPeers);
  }, []);

  const getUpdatedChain = (chain: BlockType[], startIndex: number): BlockType[] => {
    const updatedChain = [...chain];
    for (let i = startIndex; i < updatedChain.length; i++) {
      if (i > 0) {
        updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
      } else {
        updatedChain[i].previousHash = "0".repeat(64);
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return updatedChain;
  };

  const updatePeerChainAndSelectedBlock = (
    peerId: string,
    blockId: string,
    chainUpdateLogic: (chain: BlockType[]) => BlockType[]
  ) => {
    setPeers(currentPeers =>
      currentPeers.map(peer => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex(b => b.id === blockId);
          if (blockIndex === -1) return peer;

          const updatedPeerChain = chainUpdateLogic([...peer.chain]);

          if (selectedBlock && selectedBlock.id === blockId && selectedPeerId === peerId) {
            setSelectedBlock(updatedPeerChain.find(b => b.id === blockId) || null);
          }
          return { ...peer, chain: updatedPeerChain };
        }
        return peer;
      })
    );
  };

  const handleDataChange = (peerId: string, blockId: string, newData: string) => {
    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex(b => b.id === blockId);
      currentChain[blockIndex] = { ...currentChain[blockIndex], data: newData };
      return getUpdatedChain(currentChain, blockIndex);
    });
  };

  const handleNonceChange = (peerId: string, blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex(b => b.id === blockId);
      currentChain[blockIndex] = { ...currentChain[blockIndex], nonce: newNonce };
      return getUpdatedChain(currentChain, blockIndex);
    });
  };

  const handleMine = useCallback(async (peerId: string, blockId: string) => {
    const miningKey = `${peerId}-${blockId}`;
    setMiningStates(prev => ({ ...prev, [miningKey]: true }));
    await new Promise(resolve => setTimeout(resolve, 0));

    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex(b => b.id === blockId);
      const blockToMine = currentChain[blockIndex];
      let foundNonce = blockToMine.nonce;
      for (let i = 0; i <= MAX_NONCE; i++) {
        const hash = calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash);
        if (checkValidity(hash)) {
          foundNonce = i;
          break;
        }
      }
      currentChain[blockIndex] = { ...blockToMine, nonce: foundNonce };
      setMiningStates(prev => ({ ...prev, [miningKey]: false }));
      return getUpdatedChain(currentChain, blockIndex);
    });
  }, [selectedPeerId, selectedBlock]); // Dependencies for useCallback

  const showBlockModal = (peer: Peer, block: BlockType) => {
    setSelectedPeerId(peer.peerId);
    setSelectedBlock(block);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
    setSelectedPeerId(null);
  };

  return (
    <>
      <Head>
        <title>{String(t('Distributed', 'Distributed'))} - {String(t('Blockchain Demo'))}</title>
      </Head>
      <div>
        <h1>{t('DistributedViewTitle', 'Blockchain - Distributed View')}</h1>
        <Row gutter={[16, 16]}>
          {peers.map(peer => (
            <Col key={peer.peerId} xs={24} md={12} lg={8}>
              <Title level={3} style={{ textAlign: 'center' }}>{t(peer.peerId, peer.peerId)}</Title>
              <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', padding: '10px 0', WebkitOverflowScrolling: 'touch' }}>
                {peer.chain.map((block) => (
                  <div key={`${peer.peerId}-${block.id}`} style={{ marginRight: '10px', flexShrink: 0 }}>
                    <CompactBlockCard
                      blockNumber={block.blockNumber}
                      currentHash={block.currentHash}
                      previousHash={block.previousHash}
                      isValid={block.isValid}
                      onClick={() => showBlockModal(peer, block)}
                    />
                  </div>
                ))}
              </div>
            </Col>
          ))}
        </Row>

        {selectedBlock && selectedPeerId && (
          <Modal
            title={`${t('DistributedBlockDetails', 'Distributed Block Details')} - ${t('Peer', 'Peer')} ${selectedPeerId} - ${t('Block', 'Block')} #${selectedBlock.blockNumber}`}
            visible={isModalVisible}
            onOk={handleModalClose}
            onCancel={handleModalClose}
            width={800}
            footer={[ <AntButton key="close" onClick={handleModalClose}> {t('CloseButton', 'Close')} </AntButton> ]}
          >
            <BlockCard
              blockNumber={selectedBlock.blockNumber}
              nonce={selectedBlock.nonce}
              data={selectedBlock.data}
              // No specific dataType like 'transactions' or 'coinbase' here, defaults to string or generic data
              previousHash={selectedBlock.previousHash}
              currentHash={selectedBlock.currentHash}
              isValid={selectedBlock.isValid}
              onDataChange={(e) => handleDataChange(selectedPeerId, selectedBlock.id, e.target.value)}
              onNonceChange={(value) => handleNonceChange(selectedPeerId, selectedBlock.id, value)}
              onMine={() => handleMine(selectedPeerId, selectedBlock.id)}
              isMining={ miningStates[`${selectedPeerId}-${selectedBlock.id}`] || false }
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

export default DistributedPage;
