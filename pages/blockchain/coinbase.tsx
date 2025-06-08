import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NextPage } from "next";
import { useRouter } from 'next/router';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
// Removed Head, Tabs, Space, Input, InputNumber, Card, QuestionCircleOutlined, MarkdownRenderer, TutorialDisplay, TutorialStep, BlockCard
import {
  Row,
  Col,
  Typography,
  Button as AntButton,
  Modal,
  Button,
} from "antd";
// Removed some icons.
import 'reactflow/dist/style.css'; // Keep global styles for ReactFlow

import PeerChainVisualization from '@/components/Blockchain/PeerChainVisualization';
import BlockDetailModal from '@/components/Blockchain/BlockDetailModal';
import BlockchainPageLayout from '@/components/Layout/BlockchainPageLayout';
import {
  BlockType,
  TransactionType,
  CoinbaseTransactionType,
  MAX_NONCE,
  calculateHash as calculateCoinbaseBlockHash,
  checkValidity as checkCoinbaseValidity,
  createInitialBlock as createCoinbaseBlock,
  updateChainCascading as updateCoinbaseChainCascading,
} from "@/lib/blockchainUtils";
// TutorialStep might be needed if executeCoinbaseActionLogic uses it for params, but currently it doesn't seem to.
// import { TutorialStep } from '@/types/tutorial';


const initialChainLength = 3;
const peerIds = ["Peer A", "Peer B", "Peer C"];
const PRECALCULATED_NONCES = [6359, 19780, 10510];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

const getInitialCoinbase = (blockNum: number, peerInitial: string): CoinbaseTransactionType => ({
  to: `Miner-${peerInitial}`,
  value: 100,
});

const getInitialP2PTransactions = (blockNum: number, peerInitial: string): TransactionType[] => {
  if (blockNum === 1) return [];
  return [
    { id: `tx-${peerInitial}-${blockNum}-1`, from: `Miner-${peerInitial}`, to: "Alice", value: `${10 * blockNum}` },
    { id: `tx-${peerInitial}-${blockNum}-2`, from: "Alice", to: "Bob", value: `${5 * blockNum}` },
  ];
};

const CoinbasePage: NextPage = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>({});
  const [editingTxState, setEditingTxState] = useState<{ [txId: string]: Partial<TransactionType> }>({});
  const [editingCoinbaseState, setEditingCoinbaseState] = useState<{ [blockId: string]: Partial<CoinbaseTransactionType> }>({});

  interface SelectedBlockInfo { peerId: string; block: BlockType; }
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<SelectedBlockInfo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Removed state: activeTabKey, theoryContent, theoryIsLoading, theoryError,
  // isTutorialVisible, tutorialSteps, currentTutorialKey, allTutorialData

  const handleApplyCoinbaseChanges = useCallback(() => {
    if (!selectedBlockInfo) return;
    const changes = editingCoinbaseState[selectedBlockInfo.block.id];
    if (changes) {
      setPeers(prevPeers => prevPeers.map(p => {
        if (p.peerId === selectedBlockInfo.peerId) {
          let blockIndex = -1;
          const updatedChain = p.chain.map((b, index) => {
            if (b.id === selectedBlockInfo.block.id) {
              blockIndex = index;
              return { ...b, coinbase: { ...b.coinbase!, ...changes } };
            }
            return b;
          });
          if (blockIndex === -1) return p;
          setEditingCoinbaseState(prev => { const newState = { ...prev }; delete newState[selectedBlockInfo.block.id]; return newState; });
          return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
        }
        return p;
      }));
    }
  }, [selectedBlockInfo, editingCoinbaseState]);

  const handleApplyP2PTxChanges = useCallback((txId: string) => {
    if (!selectedBlockInfo) return;
    const changes = editingTxState[txId];
    if (changes) {
      setPeers(prevPeers => prevPeers.map(p => {
        if (p.peerId === selectedBlockInfo.peerId) {
          let blockIndex = -1;
          const updatedChain = p.chain.map((b, idx) => {
            if (b.id === selectedBlockInfo.block.id) {
              blockIndex = idx;
              const oldP2PTxs = Array.isArray(b.data) ? b.data as TransactionType[] : [];
              const updatedP2PTxs = oldP2PTxs.map(tItem =>
                tItem.id === txId ? { ...tItem, ...changes } : tItem
              );
              return { ...b, data: updatedP2PTxs };
            }
            return b;
          });
          if (blockIndex === -1) return p;
          setEditingTxState(prevES => { const nES = { ...prevES }; delete nES[txId]; return nES; });
          return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
        }
        return p;
      }));
    }
  }, [selectedBlockInfo, editingTxState]);

  useEffect(() => {
    // Initial peer chain setup remains.
    const newPeers: Peer[] = peerIds.map((id, peerIndex) => {
      const peerInitial = String.fromCharCode(65 + peerIndex);
      const newChain: BlockType[] = [];
      let previousHash = "0".repeat(64);
      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const coinbaseTx = getInitialCoinbase(blockNumber, peerInitial);
        const p2pTxs = getInitialP2PTransactions(blockNumber, peerInitial);
        const nonce = PRECALCULATED_NONCES[i] !== undefined ? PRECALCULATED_NONCES[i] : undefined;
        const block = createCoinbaseBlock(blockNumber, coinbaseTx, p2pTxs, previousHash, nonce);
        newChain.push(block);
        previousHash = block.currentHash;
      }
      return { peerId: id, chain: newChain };
    });
    setPeers(newPeers);
  }, []);

  useEffect(() => {
    if (selectedBlockInfo) {
      const { peerId, block: currentSelectedBlock } = selectedBlockInfo;
      const peer = peers.find(p => p.peerId === peerId);
      if (peer) {
        const updatedBlockInChain = peer.chain.find(b => b.id === currentSelectedBlock.id);
        if (updatedBlockInChain && JSON.stringify(updatedBlockInChain) !== JSON.stringify(currentSelectedBlock)) {
          setSelectedBlockInfo({ peerId, block: updatedBlockInChain });
        } else if (!updatedBlockInChain) {
          handleModalClose();
        }
      } else {
         handleModalClose();
      }
    }
  }, [peers, selectedBlockInfo]);

  const showBlockModal = useCallback((peerId: string, block: BlockType) => {
    setSelectedBlockInfo({ peerId, block });
    setIsModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSelectedBlockInfo(null);
  }, []);

  const handleNonceChange = useCallback((newNonceValue: string | number | null | undefined) => {
    if (!selectedBlockInfo) return;
    const { peerId, block: currentBlock } = selectedBlockInfo;
    const newNonce = Number(newNonceValue ?? 0);

    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const updatedChain = p.chain.map((b, index) => {
          if (b.id === currentBlock.id) {
            blockIndex = index;
            return { ...b, nonce: newNonce };
          }
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
  }, [selectedBlockInfo]);

  const handleMine = useCallback(async () => {
    if (!selectedBlockInfo) return;
    const { peerId, block: blockToMine } = selectedBlockInfo;
    const miningKey = `${peerId}-${blockToMine.id}`;
    setMiningStates(prev => ({ ...prev, [miningKey]: true }));
    await new Promise(resolve => setTimeout(resolve, 50));

    let foundNonce = blockToMine.nonce;
    for (let i = 0; i <= MAX_NONCE; i++) {
      const hash = calculateCoinbaseBlockHash(
        blockToMine.blockNumber, i, blockToMine.coinbase,
        Array.isArray(blockToMine.data) ? blockToMine.data as TransactionType[] : [],
        blockToMine.previousHash
      );
      if (checkCoinbaseValidity(hash)) {
        foundNonce = i;
        break;
      }
    }

    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const updatedChain = p.chain.map((b, index) => {
          if (b.id === blockToMine.id) {
            blockIndex = index;
            return { ...b, nonce: foundNonce };
          }
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
    setMiningStates(prev => ({ ...prev, [miningKey]: false }));
  }, [selectedBlockInfo]);

  const handleP2PTransactionChange = useCallback((txInternalId: string, fieldToChange: keyof TransactionType, newValue: any) => {
    if (!selectedBlockInfo) return;
    const { peerId, block: currentBlock } = selectedBlockInfo;
    setPeers(prevPeers => prevPeers.map(p => {
        if (p.peerId === peerId) {
            let blockIndex = -1;
            const newChainForPeer = p.chain.map((b, idx) => {
                if (b.id === currentBlock.id) {
                    blockIndex = idx;
                    const oldP2PTxs = Array.isArray(b.data) ? b.data as TransactionType[] : [];
                    const updatedP2PTxs = oldP2PTxs.map(tx =>
                        tx.id === txInternalId ? { ...tx, [fieldToChange]: newValue } : tx
                    );
                    return { ...b, data: updatedP2PTxs };
                }
                return b;
            });
            if (blockIndex === -1) return p;
            return { ...p, chain: updateCoinbaseChainCascading(newChainForPeer, blockIndex) };
        }
        return p;
    }));
  }, [selectedBlockInfo]);

  const handleCoinbaseInputChange = useCallback((field: keyof CoinbaseTransactionType, value: string | number) => {
    if (!selectedBlockInfo) return;
    const { peerId, block: currentBlock } = selectedBlockInfo;
    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const chainWithTempUpdate = p.chain.map((b, index) => {
          if (b.id === currentBlock.id) {
            blockIndex = index;
            const existingCoinbase = b.coinbase || { to: `Miner-${p.peerId.replace('Peer ','')}`, value: 0 };
            let newFieldValue = value;
            if (field === 'value' && (newFieldValue === null || newFieldValue === undefined)) {
              newFieldValue = 0;
            }
            return { ...b, coinbase: { ...existingCoinbase, [field]: newFieldValue }};
          }
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateCoinbaseChainCascading(chainWithTempUpdate, blockIndex) };
      }
      return p;
    }));
  }, [selectedBlockInfo]);

  const addBlockToChain = useCallback((pId: string) => {
    setPeers(currentPeers => currentPeers.map(p => {
      if (p.peerId === pId) {
        const lastBlock = p.chain.length > 0 ? p.chain[p.chain.length - 1] : null;
        const newBlockNumber = lastBlock ? lastBlock.blockNumber + 1 : 1;
        const previousHash = lastBlock ? lastBlock.currentHash : "0".repeat(64);
        const peerInitial = pId.replace('Peer ', '');
        const newBlock = createCoinbaseBlock(
          newBlockNumber,
          getInitialCoinbase(newBlockNumber, peerInitial),
          getInitialP2PTransactions(newBlockNumber, peerInitial),
          previousHash
        );
        return { ...p, chain: [...p.chain, newBlock] };
      }
      return p;
    }));
  }, []);

  const handleResetPeerChain = useCallback((pId: string) => {
    Modal.confirm({
        title: t('ConfirmResetChainTitle', 'Are you sure you want to reset this peer\'s chain?'),
        content: t('ConfirmResetChainContent', 'This will restore the chain to its initial state.'),
        okText: t('Reset', 'Reset'),
        okType: 'danger',
        cancelText: t('Cancel', 'Cancel'),
        onOk: () => {
            setPeers(currentPeers => currentPeers.map(p => {
              if (p.peerId === pId) {
                const peerInitial = p.peerId.replace('Peer ', '');
                const newInitialChain: BlockType[] = [];
                let previousHash = "0".repeat(64);
                for (let i = 0; i < initialChainLength; i++) {
                  const blockNumber = i + 1;
                  const coinbaseTx = getInitialCoinbase(blockNumber, peerInitial);
                  const p2pTxs = getInitialP2PTransactions(blockNumber, peerInitial);
                  const nonce = PRECALCULATED_NONCES[i] !== undefined ? PRECALCULATED_NONCES[i] : undefined;
                  const block = createCoinbaseBlock(blockNumber, coinbaseTx, p2pTxs, previousHash, nonce);
                  newInitialChain.push(block);
                  previousHash = block.currentHash;
                }
                const blockIdsToReset = p.chain.map(b => `${pId}-${b.id}`);
                setMiningStates(prevStates => {
                    const newStates = {...prevStates};
                    blockIdsToReset.forEach(id => delete newStates[id]);
                    return newStates;
                });
                return { ...p, chain: newInitialChain };
              }
              return p;
            }));
        }
    });
  }, [t]);

  const executeCoinbaseActionLogic = (actionType: string, actionParams?: any) => {
    switch (actionType) {
      case 'NAVIGATE_TO_PAGE':
        if (actionParams?.path) {
          router.push(actionParams.path);
        }
        break;
      case 'HIGHLIGHT_ELEMENT': {
        if (actionParams?.selector) {
          const element = document.querySelector(actionParams.selector);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('tutorial-highlight');
            setTimeout(() => element.classList.remove('tutorial-highlight'), 2500);
          } else { console.warn("Tutorial: Element not found for HIGHLIGHT_ELEMENT", actionParams.selector); }
        }
        break;
      }
      case 'OPEN_BLOCK_MODAL': {
        const { peerId, blockOrder } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain[blockOrder]) {
          const blockToView = targetPeer.chain[blockOrder];
          showBlockModal(peerId, blockToView);
        } else { console.warn("Peer or block not found for OPEN_BLOCK_MODAL", actionParams); }
        break;
      }
      case 'OPEN_BLOCK_MODAL_AND_FOCUS_P2P_TX': {
        const { peerId, blockOrder, p2pTxIndex, fieldToFocus } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain[blockOrder]) {
          const blockToView = targetPeer.chain[blockOrder];
          showBlockModal(targetPeer.peerId, blockToView);
          setTimeout(() => {
            const specificTxContainer = document.querySelector(`.ant-modal-body [data-p2p-tx-index="${p2pTxIndex}"]`);
            if (specificTxContainer) {
                const targetField = specificTxContainer.querySelector(`[data-field-name="${fieldToFocus}"]`) as HTMLInputElement;
                if (targetField) {
                    targetField.focus();
                    targetField.select();
                    (targetField.closest('.ant-space-item') || targetField).classList.add('tutorial-highlight');
                    setTimeout(() => (targetField.closest('.ant-space-item') || targetField).classList.remove('tutorial-highlight'), 2000);
                } else { console.warn("P2P Tx field not found with data-field-name:", fieldToFocus, "in tx index", p2pTxIndex); }
            } else { console.warn("P2P Tx container not found for index:", p2pTxIndex); }
          }, 200);
        } else { console.warn("Peer or block not found for OPEN_BLOCK_MODAL_AND_FOCUS_P2P_TX", actionParams); }
        break;
      }
      case 'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD': {
        const { peerId, blockOrder } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain[blockOrder]) {
          const blockToView = targetPeer.chain[blockOrder];
          if (!selectedBlockInfo || selectedBlockInfo.block.id !== blockToView.id || selectedBlockInfo.peerId !== peerId) {
            showBlockModal(targetPeer.peerId, blockToView);
            setTimeout(() => {
              const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary[data-testid="mine-button-in-modal"]') as HTMLElement;
              if (mineButton) mineButton.click();
              else console.warn("Mine button not found in modal after opening (delayed)", actionParams);
            }, 200);
          } else {
            const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary[data-testid="mine-button-in-modal"]') as HTMLElement;
            if (mineButton) mineButton.click();
            else console.warn("Mine button not found in modal (already open)", actionParams);
          }
        } else { console.warn("Peer or block not found for OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD", actionParams); }
        break;
      }
      default:
        console.warn(`Unknown actionType for Coinbase tutorial: ${actionType}`);
    }
  };

  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    console.log('Coinbase Tutorial Action:', actionType, actionParams);
    executeCoinbaseActionLogic(actionType, actionParams);
  };

  return (
    <BlockchainPageLayout
      pageTitle={t('CoinbasePageTitle', 'Coinbase Transactions Demo')}
      theoryDocPath="/docs/coinbase_theory.md"
      tutorialKey="coinbaseTutorial"
      onExecuteTutorialAction={handleExecuteTutorialAction}
    >
      <Row gutter={[16, 24]}>
        {peers.map((peer) => (
          <Col key={peer.peerId} span={24} className="block-card-wrapper">
            <Typography.Title level={4} style={{ textAlign: "center", marginBottom: '16px' }}>
              {t(peer.peerId, peer.peerId)}
            </Typography.Title>
            <PeerChainVisualization
              peerId={peer.peerId}
              chain={peer.chain}
              nodeType="coinbaseBlock"
              miningStates={miningStates}
              onShowBlockModal={(block) => showBlockModal(peer.peerId, block)}
              onAddBlock={() => addBlockToChain(peer.peerId)}
              onResetChain={() => handleResetPeerChain(peer.peerId)}
            />
          </Col>
        ))}
      </Row>
      {selectedBlockInfo && (
        <BlockDetailModal
          visible={isModalVisible}
            onClose={handleModalClose}
            selectedBlockInfo={selectedBlockInfo}
            miningState={miningStates[`${selectedBlockInfo.peerId}-${selectedBlockInfo.block.id}`] || false}
            onMine={handleMine}
            onNonceChange={handleNonceChange}
            blockDataType="transactions_with_coinbase"
            onCoinbaseChange={handleCoinbaseInputChange}
            onP2PTransactionChange={handleP2PTransactionChange}
            editingTxState={editingTxState}
            onApplyP2PTxChanges={handleApplyP2PTxChanges}
            editingCoinbaseState={editingCoinbaseState}
            onApplyCoinbaseChanges={handleApplyCoinbaseChanges}
          />
        )}
    </BlockchainPageLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});

export default CoinbasePage;
