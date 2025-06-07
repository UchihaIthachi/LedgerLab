import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Row, Col, Typography, Space } from 'antd'; // Added Typography for Peer titles
import BlockCard from '@/components/Blockchain/BlockCard';
import {
  BlockType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from '@/lib/blockchainUtils';

const { Title } = Typography;

const initialChainLength = 5; // Or make it smaller for this view, e.g., 3 for brevity
const peerIds = ['Peer A', 'Peer B', 'Peer C']; // Example peer IDs

interface Peer {
  peerId: string;
  chain: BlockType[];
}

const DistributedPage: NextPage = () => {
  const { t } = useTranslation('common');
  const [peers, setPeers] = useState<Peer[]>([]);
  // Mining states will be keyed like `${peerId}-${blockId}`
  const [miningStates, setMiningStates] = useState<{[key: string]: boolean}>({});

  // Initialize chains for all peers
  useEffect(() => {
    const newPeers: Peer[] = peerIds.map(id => {
      const newChain: BlockType[] = [];
      let previousHash = '0'.repeat(64);
      // Pre-calculated nonces for simple data to speed up initialization
      // These would need to be found if data or DIFFICULTY changes
      // Using the same set for each peer initially for identical starting chains
      const precalculatedNonces = [6359, 19780, 10510, 13711, 36781];

      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const data = `Block ${blockNumber} Data`; // Simple initial data for each peer
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

  // This function updates a single chain and returns its new state.
  const getUpdatedChain = (chain: BlockType[], startIndex: number): BlockType[] => {
    const updatedChain = [...chain]; // Create a mutable copy
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
    return updatedChain;
  };

  const handleDataChange = (peerId: string, blockId: string, newData: string) => {
    setPeers(currentPeers =>
      currentPeers.map(peer => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex(b => b.id === blockId);
          if (blockIndex === -1) return peer;

          const newChain = [...peer.chain];
          newChain[blockIndex] = { ...newChain[blockIndex], data: newData };
          return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
        }
        return peer;
      })
    );
  };

  const handleNonceChange = (peerId: string, blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    setPeers(currentPeers =>
      currentPeers.map(peer => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex(b => b.id === blockId);
          if (blockIndex === -1) return peer;

          const newChain = [...peer.chain];
          newChain[blockIndex] = { ...newChain[blockIndex], nonce: newNonce };
          return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
        }
        return peer;
      })
    );
  };

  const handleMine = useCallback(async (peerId: string, blockId: string) => {
    const miningKey = `${peerId}-${blockId}`;
    setMiningStates(prev => ({ ...prev, [miningKey]: true }));
    await new Promise(resolve => setTimeout(resolve, 0)); // UI update

    setPeers(currentPeers =>
      currentPeers.map(peer => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex(b => b.id === blockId);
          if (blockIndex === -1) return peer;

          const newChain = [...peer.chain];
          const blockToMine = newChain[blockIndex];

          let foundNonce = blockToMine.nonce;
          for (let i = 0; i <= MAX_NONCE; i++) { // Consider reducing MAX_NONCE for quicker demo in distributed view
            const hash = calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash);
            if (checkValidity(hash)) {
              foundNonce = i;
              break;
            }
          }
          newChain[blockIndex] = { ...blockToMine, nonce: foundNonce };
          const finalUpdatedChain = getUpdatedChain(newChain, blockIndex);
          setMiningStates(prev => ({ ...prev, [miningKey]: false }));
          return { ...peer, chain: finalUpdatedChain };
        }
        return peer;
      })
    );
  }, []);


  return (
    <>
      <Head>
        <title>{t('Distributed', 'Distributed')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <h1>{t('DistributedViewTitle', 'Blockchain - Distributed View')}</h1>
        <Row gutter={[16, 16]}> {/* Gutters for spacing between peer columns */}
          {peers.map(peer => (
            <Col key={peer.peerId} xs={24} md={12} lg={8}> {/* Responsive columns for peers */}
              <Title level={3} style={{ textAlign: 'center' }}>{t(peer.peerId, peer.peerId)}</Title> {/* Allow peerId to be translated */}
              <Space direction="vertical" style={{ width: '100%' }}>
                {peer.chain.map((block, index) => (
                  <BlockCard
                    key={`${peer.peerId}-${block.id}`}
                    blockNumber={block.blockNumber}
                    nonce={block.nonce}
                    data={block.data}
                    previousHash={block.previousHash}
                    currentHash={block.currentHash}
                    isValid={block.isValid}
                    onDataChange={(e) => handleDataChange(peer.peerId, block.id, e.target.value)}
                    onNonceChange={(value) => handleNonceChange(peer.peerId, block.id, value)}
                    onMine={() => handleMine(peer.peerId, block.id)}
                    isMining={miningStates[`${peer.peerId}-${block.id}`] || false}
                    isFirstBlock={index === 0}
                  />
                ))}
              </Space>
            </Col>
          ))}
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

export default DistributedPage;
