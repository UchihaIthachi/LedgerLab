import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NextPage } from "next";
import { useRouter } from 'next/router';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
// Removed Head, Tabs, Space, Input, QuestionCircleOutlined, MarkdownRenderer, TutorialDisplay, TutorialStep, BlockCard
// Also removing internal flow components like FlowNodeBlock, CustomEdge, and ReactFlow specific imports
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
  MAX_NONCE,
  calculateHash,
  checkValidity,
  createInitialBlock,
  updateChainCascading,
} from "@/lib/blockchainUtils";
// TutorialStep might not be needed if executeDistributedActionLogic doesn't use it for params.
// import { TutorialStep } from '@/types/tutorial';

const initialChainLength = 5;
const peerIds = ['Peer A', 'Peer B', 'Peer C'];
const PRECALCULATED_NONCES_DISTRIBUTED = [6359, 19780, 10510, 13711, 36781];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

const DistributedPage: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>({});
  const [currentMiningPeerAttemptNonce, setCurrentMiningPeerAttemptNonce] = useState<number | null>(null);
  const [currentMiningPeerAttemptHash, setCurrentMiningPeerAttemptHash] = useState<string | null>(null);

  interface SelectedBlockInfo { peerId: string; block: BlockType; }
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<SelectedBlockInfo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Removed state: activeTabKey, theoryContent, theoryIsLoading, theoryError,
  // isTutorialVisible, tutorialSteps, currentTutorialKey, allTutorialData

  useEffect(() => {
    // Initial peer chain setup remains.
    const newPeersData: Peer[] = peerIds.map(id => {
      const newChain: BlockType[] = [];
      let previousHash = '0'.repeat(64);
      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const data = `Block ${blockNumber} Data for ${id}`;
        const nonce = PRECALCULATED_NONCES_DISTRIBUTED[i] !== undefined ? PRECALCULATED_NONCES_DISTRIBUTED[i] : undefined;
        const block = createInitialBlock(blockNumber, data, previousHash, nonce, undefined);
        newChain.push(block);
        previousHash = block.currentHash;
      }
      return { peerId: id, chain: newChain };
    });
    setPeers(newPeersData);
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
  }, [peers, selectedBlockInfo]); // Added handleModalClose to dependencies if it's memoized, though not strictly needed for setter from useState

  const showBlockModal = useCallback((peerId: string, block: BlockType) => {
    setSelectedBlockInfo({ peerId, block });
    setIsModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSelectedBlockInfo(null);
    setCurrentMiningPeerAttemptNonce(null); // Clear attempts on modal close
    setCurrentMiningPeerAttemptHash(null);
  }, []);

  const handleDataChangeInModal = useCallback((newData: string) => {
    if (!selectedBlockInfo) return;
    const { peerId, block: currentBlock } = selectedBlockInfo;
    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const updatedChain = p.chain.map((b, index) => {
          if (b.id === currentBlock.id) {
            blockIndex = index;
            return { ...b, data: newData };
          }
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
  }, [selectedBlockInfo]);

  const handleNonceChangeInModal = useCallback((newNonceValue: string | number | null | undefined) => {
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
    setCurrentMiningPeerAttemptHash(calculateHash(blockToMine.blockNumber, 0, blockToMine.data, blockToMine.previousHash, undefined));
    await new Promise(resolve => setTimeout(resolve, 50)); // UI update

    let foundNonce = blockToMine.nonce;
    for (let i = 0; i <= MAX_NONCE; i++) {
      const hashAttempt = calculateHash(
        blockToMine.blockNumber, i,
        blockToMine.data,
        blockToMine.previousHash,
        undefined // No coinbase for generic blocks
      );
      if (i % 200 === 0) { // Update UI periodically
        setCurrentMiningPeerAttemptNonce(i);
        setCurrentMiningPeerAttemptHash(hashAttempt);
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield
      }
      if (checkValidity(hashAttempt)) {
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
        return { ...p, chain: updateChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
    setMiningStates(prev => ({ ...prev, [miningKey]: false }));
    setCurrentMiningPeerAttemptNonce(null); // Clear after mining
    setCurrentMiningPeerAttemptHash(null);
  }, [selectedBlockInfo]);

  const addBlockToPeerChain = useCallback((pId: string) => {
    setPeers(currentPeers => currentPeers.map(p => {
      if (p.peerId === pId) {
        const lastBlock = p.chain.length > 0 ? p.chain[p.chain.length - 1] : null;
        const newBlockNumber = lastBlock ? lastBlock.blockNumber + 1 : 1;
        const previousHash = lastBlock ? lastBlock.currentHash : "0".repeat(64);
        const newBlock = createInitialBlock(
          newBlockNumber,
          `Block ${newBlockNumber} Data for ${pId}`,
          previousHash,
          undefined,
          undefined
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
                const newInitialChain: BlockType[] = [];
                let previousHash = "0".repeat(64);
                for (let i = 0; i < initialChainLength; i++) {
                  const blockNumber = i + 1;
                  const data = `Block ${blockNumber} Data for ${pId}`;
                  const nonce = PRECALCULATED_NONCES_DISTRIBUTED[i] !== undefined ? PRECALCULATED_NONCES_DISTRIBUTED[i] : undefined;
                  const block = createInitialBlock(blockNumber, data, previousHash, nonce, undefined);
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

  const executeDistributedActionLogic = (actionType: string, actionParams?: any) => {
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
      case 'OPEN_MODAL_AND_FOCUS_DATA_WHITEBOARD': {
        const { peerId, blockOrderInPeerChain } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain.length > blockOrderInPeerChain) {
          const blockToView = targetPeer.chain[blockOrderInPeerChain];
          showBlockModal(peerId, blockToView);
          setTimeout(() => {
            const dataTextArea = document.querySelector('.ant-modal-body textarea[name="data"]') as HTMLTextAreaElement;
            if (dataTextArea && typeof dataTextArea.focus === 'function') {
              dataTextArea.focus();
              dataTextArea.select();
              dataTextArea.classList.add('tutorial-highlight');
              setTimeout(() => dataTextArea.classList.remove('tutorial-highlight'), 2000);
            } else { console.warn("Tutorial: Data textarea not found in modal for OPEN_MODAL_AND_FOCUS_DATA_WHITEBOARD"); }
          }, 150);
        } else { console.warn("Tutorial: Peer or block not found for OPEN_MODAL_AND_FOCUS_DATA_WHITEBOARD", actionParams); }
        break;
      }
      case 'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD': {
        const { peerId, blockOrderInPeerChain } = actionParams;
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain.length > blockOrderInPeerChain) {
          const blockToView = targetPeer.chain[blockOrderInPeerChain];
          if (!selectedBlockInfo || selectedBlockInfo.block.id !== blockToView.id || selectedBlockInfo.peerId !== peerId) {
            showBlockModal(peerId, blockToView);
            setTimeout(() => {
              const mineButton = document.querySelector('.ant-modal-body button[data-testid="mine-button-in-modal"]') as HTMLElement;
              if (mineButton) mineButton.click();
              else console.warn("Tutorial: Mine button not found in modal (after delay) for OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD");
            }, 150);
          } else {
            const mineButton = document.querySelector('.ant-modal-body button[data-testid="mine-button-in-modal"]') as HTMLElement;
            if (mineButton) mineButton.click();
            else console.warn("Tutorial: Mine button not found in modal (already open) for OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD");
          }
        } else { console.warn("Tutorial: Peer or block not found for OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD", actionParams); }
        break;
      }
      default:
        console.warn(`Unknown actionType for Distributed tutorial: ${actionType}`);
    }
  };

  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    console.log('Distributed Tutorial Action:', actionType, actionParams);
    executeDistributedActionLogic(actionType, actionParams);
  };

  return (
    <BlockchainPageLayout
      pageTitle={t('DistributedLedgerPageTitle', 'Distributed Ledger Demo')}
      theoryDocPath="/docs/distributed_theory.md"
      tutorialKey="distributedTutorial"
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
              nodeType="genericBlock"
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
          blockDataType="simple_text"
          onSimpleDataChange={handleDataChangeInModal}
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

export default DistributedPage;
