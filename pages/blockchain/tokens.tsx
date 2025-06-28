import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NextPage } from "next";
import { useRouter } from 'next/router';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
// Removed Head, Tabs, Space, Input, InputNumber, Card, QuestionCircleOutlined, MarkdownRenderer, TutorialDisplay, TutorialStep, BlockCard
// Also removing internal flow components like CoinbaseFlowNode, CustomEdge, and ReactFlow specific imports
import {
  Row,
  Col,
  Typography,
  Button as AntButton,
  Modal, // Still used for Modal.confirm
  Button,
} from "antd";
// Removed icons that are now internal to sub-components or layout
import 'reactflow/dist/style.css'; // Keep global styles for ReactFlow

import PeerChainVisualization from '@/components/Blockchain/PeerChainVisualization';
import BlockDetailModal from '@/components/Blockchain/BlockDetailModal';
import BlockchainPageLayout from '@/components/Layout/BlockchainPageLayout';
import {
  BlockType,
  TransactionType,
  CoinbaseTransactionType, // Keep for function signature consistency if getInitialCoinbaseForTokens is used by createInitialBlock
  MAX_NONCE,
  calculateHash,
  checkValidity,
  createInitialBlock,
  updateChainCascading,
} from "@/lib/blockchainUtils";
// TutorialStep might not be needed if executeTokensActionLogic doesn't use it for params.
// import { TutorialStep } from '@/types/tutorial';


const initialChainLengthTokens = 3;
const peerIdsTokens = ['Peer X', 'Peer Y', 'Peer Z'];
const PRECALCULATED_NONCES_TOKENS = [1010, 2020, 3030, 4040, 5050];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

const getInitialCoinbaseForTokens = (blockNum: number, peerInitial: string): CoinbaseTransactionType | undefined => {
  return undefined;
};

const getInitialP2PTransactionsForTokens = (blockNum: number, peerInitial: string): TransactionType[] => {
  if (blockNum === 1 ) {
    return [
      { id: `tx-distr-${peerInitial}-${blockNum}-1`, from: "SYSTEM_TOKEN_ISSUER", to: `UserA-${peerInitial}`, value: 1000 },
      { id: `tx-distr-${peerInitial}-${blockNum}-2`, from: `UserA-${peerInitial}`, to: `UserB-${peerInitial}`, value: 50 },
    ];
  }
  return [
    { id: `tx-${peerInitial}-${blockNum}-1`, from: `UserA-${peerInitial}`, to: `UserC-${peerInitial}`, value: `${10 + blockNum * 2}` },
    { id: `tx-${peerInitial}-${blockNum}-2`, from: `UserB-${peerInitial}`, to: `UserA-${peerInitial}`, value: `${5 + blockNum}` },
  ];
};

const TokensPage: NextPage = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>({});
  const [editingTxState, setEditingTxState] = useState<{ [txId: string]: Partial<TransactionType> }>({});
  const [currentMiningPeerAttemptNonce, setCurrentMiningPeerAttemptNonce] = useState<number | null>(null);
  const [currentMiningPeerAttemptHash, setCurrentMiningPeerAttemptHash] = useState<string | null>(null);

  interface SelectedBlockInfo { peerId: string; block: BlockType; }
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<SelectedBlockInfo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Removed state: activeTabKey, theoryContent, theoryIsLoading, theoryError,
  // isTutorialVisible, tutorialSteps, currentTutorialKey, allTutorialData

  const handleApplyP2PTxChangesTokens = useCallback((txId: string) => {
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
          return { ...p, chain: updateChainCascading(updatedChain, blockIndex) };
        }
        return p;
      }));
    }
  }, [selectedBlockInfo, editingTxState]);

  useEffect(() => {
    // Initial peer chain setup remains.
    const newPeersData: Peer[] = peerIdsTokens.map(id => {
      const peerInitial = id.replace('Peer ', '');
      const newChain: BlockType[] = [];
      let previousHash = "0".repeat(64);
      for (let i = 0; i < initialChainLengthTokens; i++) {
        const blockNumber = i + 1;
        const coinbaseTx = getInitialCoinbaseForTokens(blockNumber, peerInitial);
        const p2pTxs = getInitialP2PTransactionsForTokens(blockNumber, peerInitial);
        const nonce = PRECALCULATED_NONCES_TOKENS[i] !== undefined ? PRECALCULATED_NONCES_TOKENS[i] : undefined;
        const block = createInitialBlock(blockNumber, p2pTxs, previousHash, nonce, coinbaseTx);
        newChain.push(block);
        previousHash = block.currentHash;
      }
      return { peerId: id, chain: newChain };
    });
    setPeers(newPeersData);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSelectedBlockInfo(null);
    setCurrentMiningPeerAttemptNonce(null); // Clear attempts on modal close
    setCurrentMiningPeerAttemptHash(null);
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
  }, [peers, selectedBlockInfo, handleModalClose]);

  const showBlockModal = useCallback((peerId: string, block: BlockType) => {
    setSelectedBlockInfo({ peerId, block });
    setIsModalVisible(true);
  }, []);

  const handleNonceChangeInModal = useCallback((newNonceValue: string | number | null | undefined) => {
    if (!selectedBlockInfo) return;
    const { peerId, block: currentBlock } = selectedBlockInfo;
    const newNonce = Number(newNonceValue ?? 0);
    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const updatedChain = p.chain.map((b, index) => {
          if (b.id === currentBlock.id) { blockIndex = index; return { ...b, nonce: newNonce }; }
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
  }, [selectedBlockInfo]);

  const handleMineInModal = useCallback(async () => {
    if (!selectedBlockInfo) return;
    const { peerId, block: blockToMine } = selectedBlockInfo;
    const miningKey = `${peerId}-${blockToMine.id}`;

    setMiningStates(prev => ({ ...prev, [miningKey]: true }));
    setCurrentMiningPeerAttemptNonce(0); // Initialize
    setCurrentMiningPeerAttemptHash(calculateHash(blockToMine.blockNumber, 0, blockToMine.data, blockToMine.previousHash, blockToMine.coinbase));
    await new Promise(resolve => setTimeout(resolve, 50)); // UI update

    let foundNonce = blockToMine.nonce;
    for (let i = 0; i <= MAX_NONCE; i++) {
      const hashAttempt = calculateHash(
        blockToMine.blockNumber, i,
        blockToMine.data,
        blockToMine.previousHash,
        blockToMine.coinbase
      );
      if (i % 200 === 0) { // Update UI periodically
        setCurrentMiningPeerAttemptNonce(i);
        setCurrentMiningPeerAttemptHash(hashAttempt);
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield
      }
      if (checkValidity(hashAttempt)) { foundNonce = i; break; }
    }
    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const updatedChain = p.chain.map((b, index) => {
          if (b.id === blockToMine.id) { blockIndex = index; return { ...b, nonce: foundNonce };}
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
    setMiningStates(prev => ({ ...prev, [miningKey]: false }));
    setCurrentMiningPeerAttemptNonce(null); // Clear after mining
    setCurrentMiningPeerAttemptHash(null);
  }, [selectedBlockInfo]);

  const handleP2PTransactionChangeInModal = useCallback((txInternalId: string, fieldToChange: keyof TransactionType, newValue: any) => {
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
            return { ...p, chain: updateChainCascading(newChainForPeer, blockIndex) };
        }
        return p;
    }));
  }, [selectedBlockInfo]);

  const addBlockToPeerChain = useCallback((pId: string) => {
    setPeers(currentPeers => currentPeers.map(p => {
      if (p.peerId === pId) {
        const lastBlock = p.chain.length > 0 ? p.chain[p.chain.length - 1] : null;
        const newBlockNumber = lastBlock ? lastBlock.blockNumber + 1 : 1;
        const previousHash = lastBlock ? lastBlock.currentHash : "0".repeat(64);
        const peerInitial = pId.replace('Peer ', '');
        const newBlock = createInitialBlock(
          newBlockNumber,
          getInitialP2PTransactionsForTokens(newBlockNumber, peerInitial),
          previousHash,
          undefined,
          getInitialCoinbaseForTokens(newBlockNumber, peerInitial)
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
            for (let i = 0; i < initialChainLengthTokens; i++) {
              const blockNumber = i + 1;
              const coinbaseTx = getInitialCoinbaseForTokens(blockNumber, peerInitial);
              const p2pTxs = getInitialP2PTransactionsForTokens(blockNumber, peerInitial);
              const nonce = PRECALCULATED_NONCES_TOKENS[i] !== undefined ? PRECALCULATED_NONCES_TOKENS[i] : undefined;
              const block = createInitialBlock(blockNumber, p2pTxs, previousHash, nonce, coinbaseTx);
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

  const executeTokensActionLogic = (actionType: string, actionParams?: any) => {
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
        const { peerId, blockOrderInPeerChain } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain.length > blockOrderInPeerChain) {
          const blockToView = targetPeer.chain[blockOrderInPeerChain];
          showBlockModal(peerId, blockToView);
        } else { console.warn("Peer or block not found for OPEN_BLOCK_MODAL", actionParams); }
        break;
      }
      case 'OPEN_MODAL_AND_FOCUS_P2P_TX_WHITEBOARD': {
        const { peerId, blockOrderInPeerChain, p2pTxIndex, fieldToFocus } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain.length > blockOrderInPeerChain) {
          const blockToView = targetPeer.chain[blockOrderInPeerChain];
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
        } else { console.warn("Peer or block not found for OPEN_MODAL_AND_FOCUS_P2P_TX_WHITEBOARD", actionParams); }
        break;
      }
      case 'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD': {
        const { peerId, blockOrderInPeerChain } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain.length > blockOrderInPeerChain) {
          const blockToView = targetPeer.chain[blockOrderInPeerChain];
          if (!selectedBlockInfo || selectedBlockInfo.block.id !== blockToView.id || selectedBlockInfo.peerId !== peerId) {
            showBlockModal(targetPeer.peerId, blockToView);
            setTimeout(() => {
              const mineButton = document.querySelector('.ant-modal-body button[data-testid="mine-button-in-modal"]') as HTMLElement;
              if (mineButton) mineButton.click();
              else console.warn("Mine button not found in modal after opening (delayed)", actionParams);
            }, 200);
          } else {
            const mineButton = document.querySelector('.ant-modal-body button[data-testid="mine-button-in-modal"]') as HTMLElement;
            if (mineButton) mineButton.click();
            else console.warn("Mine button not found in modal (already open)", actionParams);
          }
        } else { console.warn("Peer or block not found for OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD", actionParams); }
        break;
      }
      default:
        console.warn(`Unknown actionType for Tokens tutorial: ${actionType}`);
    }
  };

  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    console.log('Tokens Tutorial Action:', actionType, actionParams);
    executeTokensActionLogic(actionType, actionParams);
  };

  return (
    <BlockchainPageLayout
      pageTitle={t('TokensPageTitle', 'Token Transactions Demo')}
      theoryDocPath="/docs/tokens_theory.md"
      tutorialKey="tokensTutorial"
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
              nodeType="tokenBlock"
              miningStates={miningStates}
              onShowBlockModal={(block) => showBlockModal(peer.peerId, block)}
              onAddBlock={() => addBlockToPeerChain(peer.peerId)}
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
          miningAttemptNonce={currentMiningPeerAttemptNonce ?? undefined}
          miningAttemptHash={currentMiningPeerAttemptHash ?? undefined}
          onMine={handleMineInModal}
          onNonceChange={handleNonceChangeInModal}
          blockDataType="transactions_only"
          onP2PTransactionChange={handleP2PTransactionChangeInModal}
          editingTxState={editingTxState}
          onApplyP2PTxChanges={handleApplyP2PTxChangesTokens}
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

export default TokensPage;
