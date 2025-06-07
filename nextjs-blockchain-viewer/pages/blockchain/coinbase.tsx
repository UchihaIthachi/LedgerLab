import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Row, Col, Typography, Space, Input, Button as AntButton, InputNumber } from 'antd';
import BlockCard from '@/components/Blockchain/BlockCard';
import {
  BlockType,
  TransactionType,
  CoinbaseTransactionType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from '@/lib/blockchainUtils';

const { Title } = Typography;

const initialChainLength = 3;
const peerIds = ['Peer A', 'Peer B', 'Peer C'];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

const getInitialCoinbase = (blockNum: number, peerInitial: string): CoinbaseTransactionType => ({
  to: `Miner-${peerInitial}`, value: 100
});

const getInitialP2PTransactions = (blockNum: number, peerInitial: string): TransactionType[] => {
  if (blockNum === 1) return []; // No P2P in first block for simplicity
  return [
    { id: `tx-${peerInitial}-${blockNum}-1`, from: `Miner-${peerInitial}`, to: 'Alice', value: `${10 * blockNum}` },
    { id: `tx-${peerInitial}-${blockNum}-2`, from: 'Alice', to: 'Bob', value: `${5 * blockNum}` },
  ];
};


const CoinbasePage: NextPage = () => {
  const { t } = useTranslation('common');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{[key: string]: boolean}>({});
  const [editingTxState, setEditingTxState] = useState<{[txId: string]: Partial<TransactionType>}>({});
  const [editingCoinbaseState, setEditingCoinbaseState] = useState<{[blockId: string]: Partial<CoinbaseTransactionType>}>({});


  useEffect(() => {
    const newPeers: Peer[] = peerIds.map((id, peerIndex) => {
      const peerInitial = String.fromCharCode(65 + peerIndex);
      const newChain: BlockType[] = [];
      let previousHash = '0'.repeat(64);

      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const coinbaseTx = getInitialCoinbase(blockNumber, peerInitial);
        const p2pTxs = getInitialP2PTransactions(blockNumber, peerInitial);
        const block = createInitialBlock(
          blockNumber,
          p2pTxs,
          previousHash,
          undefined, // Let it mine
          coinbaseTx
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
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash,
        updatedChain[i].coinbase
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return updatedChain;
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

  // P2P Transaction field change
  const handleTxInputChange = (txId: string, field: keyof TransactionType, value: string) => {
    setEditingTxState(prev => ({ ...prev, [txId]: { ...prev[txId], [field]: value }}));
  };

  const applyTxChanges = (peerId: string, blockId: string, txId: string) => {
    const changes = editingTxState[txId];
    if (!changes) return;
    setPeers(currentPeers => currentPeers.map(peer => {
      if (peer.peerId === peerId) {
        const blockIndex = peer.chain.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return peer;
        const newChain = [...peer.chain];
        const blockToUpdate = { ...newChain[blockIndex] };
        if (Array.isArray(blockToUpdate.data)) {
          const txIndex = blockToUpdate.data.findIndex(tx => tx.id === txId);
          if (txIndex === -1) return peer;
          const updatedTransactions = [...blockToUpdate.data];
          updatedTransactions[txIndex] = { ...updatedTransactions[txIndex], ...changes };
          blockToUpdate.data = updatedTransactions;
          newChain[blockIndex] = blockToUpdate;
          setEditingTxState(prev => { const newState = {...prev}; delete newState[txId]; return newState; });
          return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
        }
      }
      return peer;
    }));
  };

  // Coinbase Transaction field change
  const handleCoinbaseInputChange = (blockId: string, field: keyof CoinbaseTransactionType, value: string | number) => {
    setEditingCoinbaseState(prev => ({ ...prev, [blockId]: { ...prev[blockId], [field]: value }}));
  };

  const applyCoinbaseChanges = (peerId: string, blockId: string) => {
    const changes = editingCoinbaseState[blockId];
    if (!changes) return;
    setPeers(currentPeers => currentPeers.map(peer => {
      if (peer.peerId === peerId) {
        const blockIndex = peer.chain.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return peer;
        const newChain = [...peer.chain];
        newChain[blockIndex] = {
          ...newChain[blockIndex],
          coinbase: { ...newChain[blockIndex].coinbase!, ...changes }
        };
        setEditingCoinbaseState(prev => { const newState = {...prev}; delete newState[blockId]; return newState; });
        return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
      }
      return peer;
    }));
  };

  const handleMine = useCallback(async (peerId: string, blockId: string) => {
    const miningKey = `${peerId}-${blockId}`;
    setMiningStates(prev => ({ ...prev, [miningKey]: true }));
    await new Promise(resolve => setTimeout(resolve, 0));
    setPeers(currentPeers => currentPeers.map(peer => {
      if (peer.peerId === peerId) {
        const blockIndex = peer.chain.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return peer;
        const newChain = [...peer.chain];
        const blockToMine = newChain[blockIndex];
        let foundNonce = 0;
        for (let i = 0; i <= MAX_NONCE; i++) {
          if (checkValidity(calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash, blockToMine.coinbase))) {
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
    }));
  }, []);

  return (
    <>
      <Head>
        <title>{t('Coinbase', 'Coinbase')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <h1>{t('CoinbaseViewTitle', 'Blockchain - Coinbase View')}</h1>
        <Row gutter={[16, 16]}>
          {peers.map(peer => (
            <Col key={peer.peerId} xs={24} md={12} lg={8}>
              <Title level={4} style={{ textAlign: 'center' }}>{t(peer.peerId, peer.peerId)}</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                {peer.chain.map((block, index) => (
                  <div key={`${peer.peerId}-${block.id}`}>
                    <BlockCard
                      blockNumber={block.blockNumber}
                      nonce={block.nonce}
                      coinbase={block.coinbase} // Pass coinbase prop
                      data={block.data}
                      dataType="transactions"
                      previousHash={block.previousHash}
                      currentHash={block.currentHash}
                      isValid={block.isValid}
                      onNonceChange={(value) => handleNonceChange(peer.peerId, block.id, value)}
                      onMine={() => handleMine(peer.peerId, block.id)}
                      isMining={miningStates[`${peer.peerId}-${block.id}`] || false}
                      isFirstBlock={index === 0}
                    />
                    {/* Editable Coinbase Section */}
                    {block.coinbase && (
                       <Card size="small" key={`${block.id}-cb-edit`} style={{ marginTop: '5px', backgroundColor: '#fafafa' }}>
                        <Space direction="vertical" style={{width: '100%'}}>
                          <Text strong>{t('EditCoinbaseTx', 'Edit Coinbase Tx')}</Text>
                          <Input
                            addonBefore={t('To')}
                            value={editingCoinbaseState[block.id]?.to ?? block.coinbase.to}
                            onChange={e => handleCoinbaseInputChange(block.id, 'to', e.target.value)}
                          />
                          <InputNumber
                            addonBefore={t('ValueMinted', 'Value (Minted)')}
                            value={Number(editingCoinbaseState[block.id]?.value ?? block.coinbase.value)}
                            onChange={value => handleCoinbaseInputChange(block.id, 'value', value ?? 0)}
                            style={{width: '100%'}}
                          />
                          <AntButton onClick={() => applyCoinbaseChanges(peer.peerId, block.id)} type="dashed" size="small">
                            {t('ApplyCoinbaseChanges', 'Apply Coinbase Changes')}
                          </AntButton>
                        </Space>
                      </Card>
                    )}
                    {/* Editable P2P Transactions Section (if any) */}
                    {Array.isArray(block.data) && block.data.length > 0 && (
                       <Card size="small" key={`${block.id}-p2p-edit`} style={{ marginTop: '5px', backgroundColor: '#f0f0f0' }}>
                         <Text strong>{t('EditP2PTxs', 'Edit P2P Txs')}</Text>
                        {block.data.map(tx => (
                          <Space direction="vertical" key={tx.id} style={{width: '100%', marginTop: '5px', paddingTop:'5px', borderTop: '1px dashed #ccc'}}>
                            <Input addonBefore={t('From')} value={editingTxState[tx.id]?.from ?? tx.from} onChange={e => handleTxInputChange(tx.id, 'from', e.target.value)} />
                            <Input addonBefore={t('To')} value={editingTxState[tx.id]?.to ?? tx.to} onChange={e => handleTxInputChange(tx.id, 'to', e.target.value)} />
                            <Input addonBefore={t('Value')} value={editingTxState[tx.id]?.value?.toString() ?? tx.value.toString()} onChange={e => handleTxInputChange(tx.id, 'value', e.target.value)} />
                            <AntButton onClick={() => applyTxChanges(peer.peerId, block.id, tx.id)} type="dashed" size="small">
                              {t('ApplyTxChanges', 'Apply Changes to Tx')} {tx.id.substring(0,4)}...
                            </AntButton>
                          </Space>
                        ))}
                      </Card>
                    )}
                  </div>
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

export default CoinbasePage;
