import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NextPage } from "next";
import { useRouter } from 'next/router';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import {
  Row,
  Col,
  Typography,
  Space,
  Input,
  Button as AntButton,
  InputNumber,
  Card,
  Modal,
  Tabs,
  Button,
} from "antd";
import { QuestionCircleOutlined, PlusOutlined, ReloadOutlined, ExpandAltOutlined } from '@ant-design/icons';
import MarkdownRenderer from '@/components/Common/MarkdownRenderer';
import TutorialDisplay from '@/components/Tutorial/TutorialDisplay';
import { TutorialStep } from '@/types/tutorial';
import BlockCard from "@/components/Blockchain/BlockCard";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CoinbaseFlowNode, { CoinbaseFlowNodeData } from '@/components/Blockchain/CoinbaseFlowNode'; // Reusing CoinbaseFlowNode
import CustomEdge, { CustomEdgeData } from '@/components/Blockchain/CustomEdge';
import {
  BlockType,
  TransactionType,
  CoinbaseTransactionType,
  MAX_NONCE,
  calculateHash,
  checkValidity,
  createInitialBlock,
  updateChainCascading,
} from "@/lib/blockchainUtils";

const { Title } = Typography;

const initialChainLengthTokens = 3;
const peerIdsTokens = ['Peer X', 'Peer Y', 'Peer Z'];
const PRECALCULATED_NONCES_TOKENS = [1010, 2020, 3030, 4040, 5050]; // Ensure enough for initialChainLengthTokens

interface Peer {
  peerId: string;
  chain: BlockType[];
}

interface TokenPeerFlowProps {
  peer: Peer;
  miningStates: { [key: string]: boolean };
  onShowBlockModal: (peerId: string, block: BlockType) => void;
  nodeTypes: any;
  edgeTypes: any;
  onAddBlockToThisPeer: () => void;
  onResetThisPeerChain: () => void;
}

const InnerTokenFlowCanvasAndControls: React.FC<TokenPeerFlowProps> = ({
  peer,
  miningStates: globalMiningStates,
  onShowBlockModal,
  nodeTypes: passedNodeTypes,
  edgeTypes: passedEdgeTypes,
  onAddBlockToThisPeer,
  onResetThisPeerChain,
}) => {
  const { peerId, chain: peerChain } = peer;
  const [nodes, setNodes, onNodesChange] = useNodesState<CoinbaseFlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]);
  const { fitView } = useReactFlow();
  const { t } = useTranslation('common');

  useEffect(() => {
    const newNodesMapped: Node<CoinbaseFlowNodeData>[] = peerChain.map((block, index) => ({
      id: `${peerId}-${block.id}`,
      type: 'tokenBlock',
      position: { x: index * 240, y: 50 },
      data: {
        id: `${peerId}-${block.id}`,
        'data-block-id': block.id,
        blockNumber: block.blockNumber,
        currentHash: block.currentHash,
        previousHash: block.previousHash,
        isValid: block.isValid,
        coinbaseTx: block.coinbase,
        p2pTransactions: Array.isArray(block.data) ? block.data as TransactionType[] : [],
        onClick: () => onShowBlockModal(peer.peerId, block),
      },
    }));
    setNodes(newNodesMapped);

    const newEdgesMapped: Edge<CustomEdgeData>[] = [];
    for (let i = 0; i < peerChain.length - 1; i++) {
      const sourceBlock = peerChain[i];
      const targetBlock = peerChain[i + 1];
      const isLinkValid = sourceBlock.currentHash === targetBlock.previousHash;
      const miningKeySource = `${peerId}-${sourceBlock.id}`;
      const miningKeyTarget = `${peerId}-${targetBlock.id}`;
      newEdgesMapped.push({
        id: `edge-${peerId}-${sourceBlock.id}-to-${targetBlock.id}`,
        source: `${peerId}-${sourceBlock.id}`,
        target: `${peerId}-${targetBlock.id}`,
        type: 'customEdge',
        data: {
          isValid: isLinkValid,
          isAnimating: globalMiningStates[miningKeySource] || globalMiningStates[miningKeyTarget],
        },
      });
    }
    setEdges(newEdgesMapped);
  }, [peerChain, peerId, onShowBlockModal, setNodes, setEdges, globalMiningStates, peer]);

  const onConnectInternal = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const handleFitView = useCallback(() => fitView({ padding: 0.1, duration: 200 }), [fitView]);

  return (
    <>
      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, display: 'flex', gap: '8px' }}>
        <Button size="small" icon={<PlusOutlined />} onClick={onAddBlockToThisPeer} title={t('AddBlockToThisPeerChain', 'Add Block to this Chain')} />
        <Button size="small" icon={<ReloadOutlined />} onClick={onResetThisPeerChain} title={t('ResetThisPeerChain', 'Reset this Chain')} />
        <Button size="small" icon={<ExpandAltOutlined />} onClick={handleFitView} title={t('FitView', 'Fit View')} />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectInternal}
        nodeTypes={passedNodeTypes}
        edgeTypes={passedEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls showInteractive={false} />
        <Background gap={24} size={1.2} color="#efefef" />
        <svg>
          <defs>
            <marker id="arrowhead-valid" viewBox="-0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 -5 L 10 0 L 0 5 z" fill="#52c41a" />
            </marker>
            <marker id="arrowhead-invalid" viewBox="-0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 -5 L 10 0 L 0 5 z" fill="#ff4d4f" />
            </marker>
            <marker id="arrowhead-default" viewBox="-0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 -5 L 10 0 L 0 5 z" fill="#aaa" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </>
  );
};
InnerTokenFlowCanvasAndControls.displayName = "InnerTokenFlowCanvasAndControls";

const PeerBlockchainFlow: React.FC<TokenPeerFlowProps> = React.memo((props) => {
  return (
    <div data-peer-id={props.peer.peerId} style={{ width: '100%', height: '350px', marginBottom: '20px', border: '1px solid #d9d9d9', borderRadius: '8px', background: '#f9f9f9', position: 'relative' }}>
      <ReactFlowProvider>
        <InnerTokenFlowCanvasAndControls {...props} />
      </ReactFlowProvider>
    </div>
  );
});
PeerBlockchainFlow.displayName = 'PeerBlockchainFlow';

const getInitialCoinbaseForTokens = (blockNum: number, peerInitial: string): CoinbaseTransactionType | undefined => {
  // Blocks on the /tokens page primarily focus on P2P transactions.
  // No new currency is typically minted with each block in such a context,
  // unlike the coinbase page which demonstrates minting.
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
  // const [editingCoinbaseState, setEditingCoinbaseState] = useState<{ [blockId: string]: Partial<CoinbaseTransactionType> }>({}); // Removed

  interface SelectedBlockInfo { peerId: string; block: BlockType; }
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<SelectedBlockInfo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [activeTabKey, setActiveTabKey] = useState<string>("1");
  const [theoryContent, setTheoryContent] = useState<string>('');
  const [theoryIsLoading, setTheoryIsLoading] = useState<boolean>(true);
  const [theoryError, setTheoryError] = useState<string | null>(null);

  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [currentTutorialKey, setCurrentTutorialKey] = useState<string | null>(null);
  const [allTutorialData, setAllTutorialData] = useState<any | null>(null);

  const nodeTypes = useMemo(() => ({ tokenBlock: CoinbaseFlowNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: CustomEdge }), []);

  useEffect(() => {
    setTheoryIsLoading(true);
    setTheoryError(null);
    fetch('/docs/tokens_theory.md').then(res => res.text())
      .then(text => setTheoryContent(text))
      .catch(err => { console.error("Failed to fetch tokens_theory.md", err); setTheoryError(err.message); })
      .finally(() => setTheoryIsLoading(false));

    fetch('/data/tutorials/tokens_tutorial_en.json')
      .then(res => res.json())
      .then(data => setAllTutorialData(data))
      .catch(error => console.error("Could not fetch tokens_tutorial_en.json:", error));

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

  useEffect(() => {
    if (selectedBlockInfo) {
      const { peerId, block: currentSelectedBlock } = selectedBlockInfo;
      const peer = peers.find(p => p.peerId === peerId);
      if (peer) {
        const updatedBlockInChain = peer.chain.find(b => b.id === currentSelectedBlock.id);
        if (updatedBlockInChain && JSON.stringify(updatedBlockInChain) !== JSON.stringify(currentSelectedBlock)) {
          setSelectedBlockInfo({ peerId, block: updatedBlockInChain });
        }
      }
    }
  }, [peers, selectedBlockInfo]);

  const showBlockModal = useCallback((peerId: string, block: BlockType) => {
    setSelectedBlockInfo({ peerId, block });
    setIsModalVisible(true);
  }, []);

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBlockInfo(null);
  };

  const handleNonceChangeInModal = (newNonceValue: string | number | null | undefined) => {
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
  };

  const handleMineInModal = async () => {
    if (!selectedBlockInfo) return;
    const { peerId, block: blockToMine } = selectedBlockInfo;
    const miningKey = `${peerId}-${blockToMine.id}`;
    setMiningStates(prev => ({ ...prev, [miningKey]: true }));
    await new Promise(resolve => setTimeout(resolve, 50));

    let foundNonce = blockToMine.nonce;
    for (let i = 0; i <= MAX_NONCE; i++) {
      const hash = calculateHash(
        blockToMine.blockNumber, i,
        blockToMine.data,
        blockToMine.previousHash,
        blockToMine.coinbase
      );
      if (checkValidity(hash)) { foundNonce = i; break; }
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
  };

  const handleP2PTransactionChangeInModal = (txInternalId: string, fieldToChange: keyof TransactionType, newValue: any) => {
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
  };

  // Removed handleCoinbaseInputChangeInModal as coinbase editing UI is removed for /tokens page.
  // P2P transaction changes are handled by handleP2PTransactionChangeInModal.

  const addBlockToPeerChain = (pId: string) => {
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
  };

  const handleResetPeerChain = (pId: string) => {
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
  };

  const startTutorial = (tutorialKey: string) => {
    if (allTutorialData && allTutorialData[tutorialKey]) {
      const selectedTutorial = allTutorialData[tutorialKey];
      const flattenedSteps: TutorialStep[] = selectedTutorial.sections.reduce(
        (acc: TutorialStep[], section: any) => acc.concat(section.steps), []
      );
      setTutorialSteps(flattenedSteps);
      setCurrentTutorialKey(tutorialKey);
      setIsTutorialVisible(true);
    } else {
      console.warn(`Tutorial with key "${tutorialKey}" not found or data not loaded yet.`);
    }
  };

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
        const { peerId, blockOrderInPeerChain } = actionParams; // blockOrderInPeerChain from plan
        const targetPeer = peers.find(p => p.peerId === peerId);
        if (targetPeer && targetPeer.chain.length > blockOrderInPeerChain) {
          const blockToView = targetPeer.chain[blockOrderInPeerChain];
          showBlockModal(peerId, blockToView);
        } else { console.warn("Peer or block not found for OPEN_BLOCK_MODAL", actionParams); }
        break;
      }
      case 'OPEN_MODAL_AND_FOCUS_P2P_TX_WHITEBOARD': { // Matching JSON
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
      case 'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD': { // Matching JSON
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
    const demoInteractionActions = [
        'HIGHLIGHT_ELEMENT',
        'OPEN_BLOCK_MODAL',
        'OPEN_MODAL_AND_FOCUS_P2P_TX_WHITEBOARD',
        'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD'
    ];
    if (demoInteractionActions.includes(actionType) && activeTabKey !== "1") {
      setActiveTabKey("1");
      setTimeout(() => executeTokensActionLogic(actionType, actionParams), 100);
      return;
    }
    executeTokensActionLogic(actionType, actionParams);
  };

  return (
    <>
      <Head>
        <title>{t('Tokens')} - {t('BlockchainDemo')}</title>
      </Head>
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('TokensPageTitle', 'Token Transactions Demo')}
          </Typography.Title>
          <Button icon={<QuestionCircleOutlined />} onClick={() => startTutorial('tokensTutorial')}>
            {t('StartTutorial', 'Start Tutorial')}
          </Button>
        </div>

        <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
          <Tabs.TabPane tab={t('InteractiveDemoTab', 'Interactive Demo')} key="1">
            <Row gutter={[16, 24]}>
              {peers.map((peer) => (
                <Col key={peer.peerId} span={24} className="block-card-wrapper">
                  <Title level={4} style={{ textAlign: "center", marginBottom: '16px' }}>
                    {t(peer.peerId, peer.peerId)}
                  </Title>
                  <PeerBlockchainFlow
                    peer={peer}
                    miningStates={miningStates}
                    onShowBlockModal={showBlockModal}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onAddBlockToThisPeer={() => addBlockToPeerChain(peer.peerId)}
                    onResetThisPeerChain={() => handleResetPeerChain(peer.peerId)}
                  />
                </Col>
              ))}
            </Row>
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('TheoryTab', 'Theory & Explanation')} key="2">
            <div className="theory-content-markdown" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '10px' }}>
              <MarkdownRenderer
                markdownContent={theoryContent}
                isLoading={theoryIsLoading}
                error={theoryError}
                className="tutorial-content-markdown"
                loadingMessage={t('LoadingTheory', 'Loading theory...')}
                errorMessagePrefix={t('ErrorLoadingTheoryPrefix', 'Error loading content:')}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>

        {isTutorialVisible && tutorialSteps.length > 0 && (
          <TutorialDisplay
            tutorialKey={currentTutorialKey || "tokensTutorial"}
            steps={tutorialSteps}
            isVisible={isTutorialVisible}
            onClose={() => setIsTutorialVisible(false)}
            onExecuteAction={handleExecuteTutorialAction}
          />
        )}
        {selectedBlockInfo && (
          <Modal
            title={`${t('TokenBlockDetails', 'Token Block Details')} - ${t('Peer', 'Peer')} ${selectedBlockInfo.peerId} - ${t('Block', 'Block')} #${selectedBlockInfo.block.blockNumber}`}
            visible={isModalVisible}
            onOk={handleModalClose}
            onCancel={handleModalClose}
            width={800}
            footer={[ <AntButton key="close" onClick={handleModalClose}> {t('CloseButton', 'Close')} </AntButton> ]}
          >
            <BlockCard
              blockNumber={selectedBlockInfo.block.blockNumber}
              nonce={selectedBlockInfo.block.nonce}
              coinbase={selectedBlockInfo.block.coinbase}
              data={Array.isArray(selectedBlockInfo.block.data) ? selectedBlockInfo.block.data : []}
              dataType="transactions"
              previousHash={selectedBlockInfo.block.previousHash}
              currentHash={selectedBlockInfo.block.currentHash}
              isValid={selectedBlockInfo.block.isValid}
              onNonceChange={(value) => handleNonceChangeInModal(value)}
              onMine={handleMineInModal}
              isMining={ miningStates[`${selectedBlockInfo.peerId}-${selectedBlockInfo.block.id}`] || false }
              isFirstBlock={selectedBlockInfo.block.blockNumber === 1}
            />
            {/* Coinbase editing Card removed as selectedBlockInfo.block.coinbase will be undefined */}
            {Array.isArray(selectedBlockInfo.block.data) && selectedBlockInfo.block.data.length > 0 && (
              <Card size="small" key={`${selectedBlockInfo.block.id}-p2p-edit-tokens`} style={{ marginTop: "5px", backgroundColor: "#f0f0f0" }}>
                <Typography.Text strong>{t("EditP2PTxs", "Edit P2P Txs")}</Typography.Text>
                {selectedBlockInfo.block.data.map((tx, txIndex) => (
                  <Space direction="vertical" key={tx.id} style={{ width: "100%", marginTop: "5px", paddingTop: "5px", borderTop: "1px dashed #ccc" }} data-p2p-tx-index={txIndex}>
                    <Input addonBefore={t("From")}
                      value={editingTxState[tx.id]?.from ?? tx.from}
                      onChange={(e) => handleP2PTransactionChangeInModal(tx.id, "from", e.target.value)}
                      data-field-name="from"
                    />
                    <Input addonBefore={t("To")}
                      value={editingTxState[tx.id]?.to ?? tx.to}
                      onChange={(e) => handleP2PTransactionChangeInModal(tx.id, "to", e.target.value)}
                      data-field-name="to"
                    />
                    <Input addonBefore={t("Value")}
                      value={editingTxState[tx.id]?.value?.toString() ?? tx.value.toString()}
                      onChange={(e) => handleP2PTransactionChangeInModal(tx.id, "value", e.target.value)}
                      data-field-name="value"
                    />
                    <AntButton onClick={() => { /* Apply P2P Tx Changes Logic */
                        if(selectedBlockInfo){
                            const changes = editingTxState[tx.id];
                            if (changes) {
                                setPeers(prevPeers => prevPeers.map(p => {
                                  if (p.peerId === selectedBlockInfo.peerId) {
                                      let blockIndex = -1;
                                      const updatedChain = p.chain.map((b, idx) => {
                                          if (b.id === selectedBlockInfo.block.id) {
                                              blockIndex = idx;
                                              const oldP2PTxs = Array.isArray(b.data) ? b.data as TransactionType[] : [];
                                              const updatedP2PTxs = oldP2PTxs.map(tItem =>
                                                  tItem.id === tx.id ? { ...tItem, ...changes } : tItem
                                              );
                                              return { ...b, data: updatedP2PTxs };
                                          }
                                          return b;
                                      });
                                      if (blockIndex === -1) return p;
                                      setEditingTxState(prevES => { const nES = {...prevES}; delete nES[tx.id]; return nES; });
                                      return { ...p, chain: updateChainCascading(updatedChain, blockIndex) };
                                  }
                                  return p;
                                }));
                            }
                        }
                    }} type="dashed" size="small">
                      {t("ApplyTxChanges", "Apply Changes to Tx")} {tx.id.substring(0, 4)}...
                    </AntButton>
                  </Space>
                ))}
              </Card>
            )}
          </Modal>
        )}
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});

export default TokensPage;
