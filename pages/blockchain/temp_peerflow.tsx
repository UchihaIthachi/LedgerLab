import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NextPage } from "next";
import { useTranslation } from "next-i18next";
import {
  Row,
  Col,
  Typography,
  // Space, // Space might be needed if re-added to PeerBlockchainFlow or main component
  // Input, // Input related components are for the modal
  Button as AntButton,
  // InputNumber, // Input related components are for the modal
  // Card, // Card is used in modal
  // Modal, // Modal is in main component
  Tabs,
  Button,
} from "antd";
import { QuestionCircleOutlined } from '@ant-design/icons';
// import MarkdownRenderer from '@/components/Common/MarkdownRenderer'; // In main component
// import TutorialDisplay from '@/components/Tutorial/TutorialDisplay'; // In main component
// import { TutorialStep } from '@/types/tutorial'; // In main component
// import BlockCard from "@/components/Blockchain/BlockCard"; // In main component
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
  // MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CoinbaseFlowNode, { CoinbaseFlowNodeData } from '@/components/Blockchain/CoinbaseFlowNode';
import CustomEdge, { CustomEdgeData } from '@/components/Blockchain/CustomEdge';
import {
  BlockType,
  TransactionType, // Keep if p2pTransactions in CoinbaseFlowNodeData needs it explicitly
  CoinbaseTransactionType, // Keep for CoinbaseFlowNodeData
  // calculateHash, // Not directly used in PeerBlockchainFlow
  // checkValidity, // Not directly used in PeerBlockchainFlow
  // createInitialBlock, // Not directly used in PeerBlockchainFlow
  // MAX_NONCE, // Not directly used in PeerBlockchainFlow
} from "@/lib/blockchainUtils";

const { Title } = Typography;

// Interface for Peer, used by PeerBlockchainFlow and CoinbasePage
interface Peer {
  peerId: string;
  chain: BlockType[];
}

// Define PeerBlockchainFlow here as it's specific to this page and uses its state/handlers
interface PeerBlockchainFlowProps {
  peer: Peer;
  miningStates: { [key: string]: boolean };
  onShowBlockModal: (peer: Peer, block: BlockType) => void;
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
  // IMPORTANT: Nodes and Edges state should be managed per peer instance if multiple flows are on one page.
  // This means if PeerBlockchainFlow is used multiple times, each needs its own state.
  // This is correctly handled by React Flow if useNodesState/useEdgesState are called within PeerBlockchainFlow.
  const [nodes, setNodes, onNodesChange] = useNodesState<CoinbaseFlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]);

  useEffect(() => {
    const newNodes: Node<CoinbaseFlowNodeData>[] = peerChain.map((block, index) => ({
      id: `${peerId}-${block.id}`, // Ensure node IDs are unique across all peers if one ReactFlow instance was used
                                  // If multiple ReactFlow instances, block.id is fine. Assuming one per peer for now.
      type: 'coinbaseBlock',
      position: { x: index * 240, y: 50 },
      data: {
        id: `${peerId}-${block.id}`, // Internal data id, can be same as node id
        'data-block-id': block.id, // Original block id for any external targeting
        blockNumber: block.blockNumber,
        currentHash: block.currentHash,
        previousHash: block.previousHash,
        isValid: block.isValid,
        coinbaseTx: block.coinbase,
        p2pTransactions: Array.isArray(block.data) ? block.data as TransactionType[] : [],
        onClick: () => onShowBlockModal(peer, block),
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
        // Ensure edge IDs are also unique across peers if a single ReactFlow instance was used
        id: `edge-${peerId}-${sourceBlock.id}-to-${targetBlock.id}`,
        source: `${peerId}-${sourceBlock.id}`, // Match unique node ID
        target: `${peerId}-${targetBlock.id}`, // Match unique node ID
        type: 'customEdge',
        data: {
          isValid: isLinkValid,
          isAnimating: globalMiningStates[miningKeySource] || globalMiningStates[miningKeyTarget]
        },
      });
    }
    setNodes(newNodes);
    setEdges(newEdges);
  }, [peerChain, peerId, onShowBlockModal, setNodes, setEdges, globalMiningStates, peer]); // Added `peer` to dependencies

  const onConnectInternal = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),[setEdges]);

  // Unique marker IDs per peer instance
  const validMarkerId = `arrowhead-valid-${peerId.replace(/\s+/g, '-')}`;
  const invalidMarkerId = `arrowhead-invalid-${peerId.replace(/\s+/g, '-')}`;

  // Pass peer-specific marker URLs to CustomEdge if CustomEdge is modified to accept them
  // Or, ensure CustomEdge uses global marker IDs, and those are defined once in the main SVG outside all flows.
  // For this approach (ReactFlow per peer), each needs its own <defs> or global defs must be used by CustomEdge.
  // The CustomEdge currently uses global 'url(#arrowhead-valid)'. This will only work if such global defs exist.
  // If global defs are in the main SVG of the _app.tsx or Layout, it might work.
  // Otherwise, CustomEdge needs to be adapted or defs provided here.
  // For simplicity here, we'll assume CustomEdge uses fixed global IDs, and we add those defs within each flow.
  // This is not ideal for performance but simplest to implement without changing CustomEdge.
  // A better way: make CustomEdge accept markerUrl props.

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
