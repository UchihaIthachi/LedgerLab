import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NextPage } from "next";
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
import { QuestionCircleOutlined } from '@ant-design/icons';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import CoinbaseFlowNode, { CoinbaseFlowNodeData } from '@/components/Blockchain/CoinbaseFlowNode';
import CustomEdge, { CustomEdgeData } from '@/components/Blockchain/CustomEdge';
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

const { Title } = Typography;

const initialChainLength = 3;
const peerIds = ["Peer A", "Peer B", "Peer C"];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

interface PeerBlockchainFlowProps {
  peer: Peer;
  miningStates: { [key: string]: boolean };
  onShowBlockModal: (peerId: string, block: BlockType) => void;
  nodeTypes: any;
  edgeTypes: any;
}

const PeerBlockchainFlow: React.FC<PeerBlockchainFlowProps> = React.memo(({
  peer,
  miningStates: globalMiningStates,
  onShowBlockModal,
  nodeTypes: nodeTypesExt,
  edgeTypes: edgeTypesExt,
}) => {
  const { peerId, chain: peerChain } = peer;
  const [nodes, setNodes, onNodesChange] = useNodesState<CoinbaseFlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]);

  useEffect(() => {
    const newNodes: Node<CoinbaseFlowNodeData>[] = peerChain.map((block, index) => ({
      id: `${peerId}-${block.id}`,
      type: 'coinbaseBlock',
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

    const newEdges: Edge<CustomEdgeData>[] = [];
    for (let i = 0; i < peerChain.length - 1; i++) {
      const sourceBlock = peerChain[i];
      const targetBlock = peerChain[i + 1];
      const isLinkValid = sourceBlock.currentHash === targetBlock.previousHash;
      const miningKeySource = `${peerId}-${sourceBlock.id}`;
      const miningKeyTarget = `${peerId}-${targetBlock.id}`;
      newEdges.push({
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
    setNodes(newNodes);
    setEdges(newEdges);
  }, [peerChain, peerId, onShowBlockModal, setNodes, setEdges, globalMiningStates, peer]);

  const onConnectInternal = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ width: '100%', height: '350px', marginBottom: '20px', border: '1px solid #d9d9d9', borderRadius: '8px', background: '#f9f9f9' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnectInternal}
          nodeTypes={nodeTypesExt}
          edgeTypes={edgeTypesExt}
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
      </ReactFlowProvider>
    </div>
  );
});
PeerBlockchainFlow.displayName = 'PeerBlockchainFlow';

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
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>({});
  const [editingTxState, setEditingTxState] = useState<{ [txId: string]: Partial<TransactionType> }>({});
  const [editingCoinbaseState, setEditingCoinbaseState] = useState<{ [blockId: string]: Partial<CoinbaseTransactionType> }>({});

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

  const nodeTypes = useMemo(() => ({ coinbaseBlock: CoinbaseFlowNode }), []);
  const edgeTypes = useMemo(() => ({ customEdge: CustomEdge }), []);

  useEffect(() => {
    setTheoryIsLoading(true);
    setTheoryError(null);
    fetch('/docs/coinbase_theory.md').then(res => res.text())
      .then(text => setTheoryContent(text))
      .catch(err => { console.error("Failed to fetch coinbase_theory.md", err); setTheoryError(err.message); })
      .finally(() => setTheoryIsLoading(false));

    fetch('/data/tutorials/coinbase_tutorial_en.json').then(res => res.json())
      .then(data => setAllTutorialData(data))
      .catch(error => console.error("Could not fetch coinbase tutorial data:", error));

    const newPeers: Peer[] = peerIds.map((id, peerIndex) => {
      const peerInitial = String.fromCharCode(65 + peerIndex);
      const newChain: BlockType[] = [];
      let previousHash = "0".repeat(64);
      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const coinbaseTx = getInitialCoinbase(blockNumber, peerInitial);
        const p2pTxs = getInitialP2PTransactions(blockNumber, peerInitial);
        const block = createCoinbaseBlock(blockNumber, coinbaseTx, p2pTxs, previousHash);
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

  const handleNonceChange = (newNonceValue: string | number | null | undefined) => {
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
  };

  const handleMine = async () => {
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
  };

  const handleP2PTransactionChange = (txInternalId: string, fieldToChange: keyof TransactionType, newValue: any) => {
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
  };

  const handleCoinbaseInputChange = (field: keyof CoinbaseTransactionType, value: string | number) => {
    if (!selectedBlockInfo) return;
    const { peerId, block: currentBlock } = selectedBlockInfo;

    setPeers(prevPeers => prevPeers.map(p => {
      if (p.peerId === peerId) {
        let blockIndex = -1;
        const updatedChain = p.chain.map((b, index) => {
          if (b.id === currentBlock.id) {
            blockIndex = index;
            const currentCoinbase = b.coinbase || { to: '', value: 0 };
            return { ...b, coinbase: { ...currentCoinbase, [field]: value } };
          }
          return b;
        });
        if (blockIndex === -1) return p;
        return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
      }
      return p;
    }));
  };

  const addBlockToChain = (pId: string) => {
    setPeers(currentPeers => currentPeers.map(p => {
      if (p.peerId === pId && p.chain.length > 0) {
        const lastBlock = p.chain[p.chain.length - 1];
        const newBlockNumber = lastBlock.blockNumber + 1;
        const peerInitial = pId.replace('Peer ', '');
        const newBlock = createCoinbaseBlock(
          newBlockNumber,
          getInitialCoinbase(newBlockNumber, peerInitial),
          getInitialP2PTransactions(newBlockNumber, peerInitial),
          lastBlock.currentHash
        );
        return { ...p, chain: [...p.chain, newBlock] };
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

  const executeCoinbaseActionLogic = (actionType: string, actionParams?: any) => {
    switch (actionType) {
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
      case 'OPEN_BLOCK_MODAL': { // Added from tutorial JSON
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
      case 'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD': { // Matched JSON actionType
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
    const demoInteractionActions = [
        'HIGHLIGHT_ELEMENT',
        'OPEN_BLOCK_MODAL',
        'OPEN_BLOCK_MODAL_AND_FOCUS_P2P_TX',
        'OPEN_MODAL_AND_CLICK_MINE_WHITEBOARD'
    ];
    if (demoInteractionActions.includes(actionType) && activeTabKey !== "1") {
      setActiveTabKey("1");
      setTimeout(() => executeCoinbaseActionLogic(actionType, actionParams), 100);
      return;
    }
    executeCoinbaseActionLogic(actionType, actionParams);
  };

  return (
    <>
      <Head>
        <title>{t('CoinbaseTransactions')} - {t('BlockchainDemo', 'Blockchain Demo')}</title>
      </Head>
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('CoinbasePageTitle', 'Coinbase Transactions Demo')}
          </Typography.Title>
          <Button icon={<QuestionCircleOutlined />} onClick={() => startTutorial('coinbaseTutorial')}>
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
                  />
                   <AntButton onClick={() => addBlockToChain(peer.peerId)} style={{ marginTop: '10px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
                    {t('AddBlockToPeer', `Add Block to ${peer.peerId}`)}
                  </AntButton>
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
            tutorialKey={currentTutorialKey || "coinbaseTutorial"}
            steps={tutorialSteps}
            isVisible={isTutorialVisible}
            onClose={() => setIsTutorialVisible(false)}
            onExecuteAction={handleExecuteTutorialAction}
          />
        )}
        {selectedBlockInfo && (
          <Modal
            title={`${t('CoinbaseBlockDetails', 'Coinbase Block Details')} - ${t('Peer', 'Peer')} ${selectedBlockInfo.peerId} - ${t('Block', 'Block')} #${selectedBlockInfo.block.blockNumber}`}
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
              data={selectedBlockInfo.block.data}
              dataType="transactions"
              previousHash={selectedBlockInfo.block.previousHash}
              currentHash={selectedBlockInfo.block.currentHash}
              isValid={selectedBlockInfo.block.isValid}
              onNonceChange={(value) => handleNonceChange(value)}
              onMine={handleMine}
              isMining={ miningStates[`${selectedBlockInfo.peerId}-${selectedBlockInfo.block.id}`] || false }
              isFirstBlock={selectedBlockInfo.block.blockNumber === 1}
            />
            {selectedBlockInfo.block.coinbase && (
              <Card size="small" key={`${selectedBlockInfo.block.id}-cb-edit-modal`} style={{ marginTop: "5px", backgroundColor: "#fafafa" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>{t("EditCoinbaseTx", "Edit Coinbase Tx")}</Text>
                  <Input addonBefore={t("To")}
                    value={ editingCoinbaseState[selectedBlockInfo.block.id]?.to ?? selectedBlockInfo.block.coinbase.to }
                    onChange={(e) => handleCoinbaseInputChange("to", e.target.value)}
                  />
                  <InputNumber addonBefore={t("ValueMinted", "Value (Minted)")}
                    value={Number(editingCoinbaseState[selectedBlockInfo.block.id]?.value ?? selectedBlockInfo.block.coinbase.value)}
                    onChange={(value) => handleCoinbaseInputChange("value", value ?? 0)} style={{ width: "100%" }}
                  />
                  <AntButton onClick={() => {
                      if(selectedBlockInfo){
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
                                      setEditingCoinbaseState(prev => { const newState = {...prev}; delete newState[selectedBlockInfo.block.id]; return newState;});
                                      return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
                                  }
                                  return p;
                              }));
                          }
                      }
                  }} type="dashed" size="small">
                    {t("ApplyCoinbaseChanges", "Apply Coinbase Changes")}
                  </AntButton>
                </Space>
              </Card>
            )}
            {Array.isArray(selectedBlockInfo.block.data) && selectedBlockInfo.block.data.length > 0 && (
              <Card size="small" key={`${selectedBlockInfo.block.id}-p2p-edit-modal`} style={{ marginTop: "5px", backgroundColor: "#f0f0f0" }}>
                <Text strong>{t("EditP2PTxs", "Edit P2P Txs")}</Text>
                {selectedBlockInfo.block.data.map((tx, txIndex) => (
                  <Space direction="vertical" key={tx.id} style={{ width: "100%", marginTop: "5px", paddingTop: "5px", borderTop: "1px dashed #ccc" }} data-p2p-tx-index={txIndex}>
                    <Input addonBefore={t("From")}
                      value={editingTxState[tx.id]?.from ?? tx.from}
                      onChange={(e) => handleTxInputChange(tx.id, "from", e.target.value)}
                      data-field-name="from"
                    />
                    <Input addonBefore={t("To")}
                      value={editingTxState[tx.id]?.to ?? tx.to}
                      onChange={(e) => handleTxInputChange(tx.id, "to", e.target.value)}
                      data-field-name="to"
                    />
                    <Input addonBefore={t("Value")}
                      value={editingTxState[tx.id]?.value?.toString() ?? tx.value.toString()}
                      onChange={(e) => handleTxInputChange(tx.id, "value", e.target.value)}
                      data-field-name="value"
                    />
                    <AntButton onClick={() => {
                        if(selectedBlockInfo){
                            const changes = editingTxState[tx.id];
                            if (changes) {
                               // Direct call to handleP2PTransactionChange for each field is not ideal.
                               // This should ideally be a single call that processes all changes for a tx.
                               // For simplicity of this step, we'll assume a more direct update or that
                               // handleP2PTransactionChange is smart enough.
                               // A better approach would be to collect all changes for txId and then make one call.
                               // For now, let's assume we call multiple times if multiple fields changed,
                               // or the original applyTxChanges was better.
                               // Reverting to a simpler apply for this example.
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
                                      return { ...p, chain: updateCoinbaseChainCascading(updatedChain, blockIndex) };
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

export default CoinbasePage;
