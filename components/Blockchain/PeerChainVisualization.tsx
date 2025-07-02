import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "reactflow";
import { Button, theme } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ExpandAltOutlined,
} from "@ant-design/icons";
import { useTranslation } from "next-i18next";
import "reactflow/dist/style.css";

import {
  BlockType,
  TransactionType,
  CoinbaseTransactionType,
} from "@/lib/blockchainUtils";
import CoinbaseFlowNode, { CoinbaseFlowNodeData } from "./CoinbaseFlowNode";
import FlowNodeBlock, { FlowNodeBlockData } from "./FlowNodeBlock";
import CustomEdge, { CustomEdgeData } from "./CustomEdge";

export interface PeerChainVisualizationProps {
  peerId: string;
  chain: BlockType[];
  nodeType: "coinbaseBlock" | "genericBlock" | "tokenBlock";
  miningStates: { [key: string]: boolean }; // Key is blockId (original, not peerId-prefixed)
  onShowBlockModal: (block: BlockType) => void;
  onAddBlock: () => void;
  onResetChain: () => void;
}

const SvgDefsComponent = ({
  token,
}: {
  token: ReturnType<typeof theme.useToken>["token"];
}) => (
  <svg>
    <defs>
      <marker
        id="arrowhead-valid"
        viewBox="-0 -5 10 10"
        refX="10"
        refY="0"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path
          d="M 0 -5 L 10 0 L 0 5 z"
          fill="var(--chain-arrowhead-color-valid)"
        />
      </marker>
      <linearGradient id="edgeGradientValid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          style={{
            stopColor: "var(--chain-link-gradient-start)",
            stopOpacity: 1,
          }}
        />
        <stop
          offset="100%"
          style={{
            stopColor: "var(--chain-link-gradient-end)",
            stopOpacity: 1,
          }}
        />
      </linearGradient>
      <marker
        id="arrowhead-invalid"
        viewBox="-0 -5 10 10"
        refX="10"
        refY="0"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M 0 -5 L 10 0 L 0 5 z" fill={token.colorError} />
      </marker>
      <marker
        id="arrowhead-default"
        viewBox="-0 -5 10 10"
        refX="10"
        refY="0"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M 0 -5 L 10 0 L 0 5 z" fill={token.colorTextDisabled} />
      </marker>
    </defs>
  </svg>
);
SvgDefsComponent.displayName = "SvgDefsComponent";

const InnerCanvasAndControls: React.FC<PeerChainVisualizationProps> = (
  props
) => {
  const {
    peerId,
    chain,
    nodeType,
    miningStates,
    onShowBlockModal,
    onAddBlock,
    onResetChain,
  } = props;
  const { t } = useTranslation("common");
  const { token } = theme.useToken();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<
    CoinbaseFlowNodeData | FlowNodeBlockData
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]);

  useEffect(() => {
    // Re-apply: Delay fitView call to ensure the viewport and D3 elements are fully initialized
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 }); // Use padding from previous fitViewOptions
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fitView, nodes, edges]);

  const nodeTypes = useMemo(
    () => ({
      coinbaseBlock: CoinbaseFlowNode,
      genericBlock: FlowNodeBlock,
      tokenBlock: CoinbaseFlowNode, // Reusing CoinbaseFlowNode for tokenBlock
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      customEdge: CustomEdge,
    }),
    []
  );

  useEffect(() => {
    const newNodes: Node<CoinbaseFlowNodeData | FlowNodeBlockData>[] =
      chain.map((block, index) => {
        const nodeId = `${peerId}-${block.id}`;
        let nodeData: CoinbaseFlowNodeData | FlowNodeBlockData;

        if (nodeType === "coinbaseBlock" || nodeType === "tokenBlock") {
          nodeData = {
            id: nodeId,
            "data-block-id": block.id, // Store original block id for modal or other interactions
            blockNumber: block.blockNumber,
            nonce: block.nonce,
            currentHash: block.currentHash,
            previousHash: block.previousHash,
            isValid: block.isValid,
            coinbase: block.coinbase, // May be undefined for tokenBlock if not applicable
            p2pTransactions: Array.isArray(block.data)
              ? (block.data as TransactionType[])
              : [],
            onClick: () => onShowBlockModal(block),
            // onRemove and isGenesis are not directly part of PeerChainVisualizationProps
            // Assuming CoinbaseFlowNode can handle them being potentially undefined in its data
          };
        } else {
          // genericBlock
          nodeData = {
            id: nodeId,
            "data-block-id": block.id,
            blockNumber: block.blockNumber,
            nonce: block.nonce, // genericBlock expects nonce
            data:
              typeof block.data === "string"
                ? block.data
                : JSON.stringify(block.data), // genericBlock expects data as string
            currentHash: block.currentHash,
            previousHash: block.previousHash,
            isValid: block.isValid,
            onClick: () => onShowBlockModal(block),
            // onRemove and isGenesis are not directly part of PeerChainVisualizationProps
            // Assuming FlowNodeBlock can handle them being potentially undefined
          };
        }

        return {
          id: nodeId,
          type: nodeType,
          position: { x: index * 220, y: 50 }, // Adjusted spacing slightly
          data: nodeData,
        };
      });

    const newEdges: Edge<CustomEdgeData>[] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const sourceBlock = chain[i];
      const targetBlock = chain[i + 1];
      const sourceNodeId = `${peerId}-${sourceBlock.id}`;
      const targetNodeId = `${peerId}-${targetBlock.id}`;

      const isLinkValid = sourceBlock.currentHash === targetBlock.previousHash;
      // miningStates key is original block.id
      const isEdgeRelatedToMining =
        miningStates[sourceBlock.id] || miningStates[targetBlock.id];

      newEdges.push({
        id: `edge-${peerId}-${sourceBlock.id}-to-${targetBlock.id}`,
        source: sourceNodeId,
        target: targetNodeId,
        type: "customEdge",
        data: {
          isValid: isLinkValid,
          isAnimating: !!isEdgeRelatedToMining,
        },
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    chain,
    peerId,
    nodeType,
    onShowBlockModal,
    miningStates,
    setNodes,
    setEdges,
  ]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.1, duration: 200 });
  }, [fitView]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          zIndex: 10,
          display: "flex",
          gap: "8px",
        }}
      >
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={onAddBlock}
          title={t("AddBlock", "Add Block")}
        />
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={onResetChain}
          title={t("ResetChain", "Reset Chain")}
        />
        <Button
          size="small"
          icon={<ExpandAltOutlined />}
          onClick={handleFitView}
          title={t("FitView", "Fit View")}
        />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // fitView prop removed again for workaround
        // fitViewOptions prop removed again for workaround
        proOptions={{ hideAttribution: true }} // Hide React Flow attribution
      >
        <Controls showInteractive={false} />{" "}
        {/* Basic controls, non-interactive for cleaner look */}
        <Background color={token.colorBorder} gap={24} size={1.2} />
        <SvgDefsComponent token={token} />
      </ReactFlow>
    </>
  );
};
InnerCanvasAndControls.displayName = "InnerCanvasAndControls";

const PeerChainVisualization: React.FC<PeerChainVisualizationProps> =
  React.memo((props) => {
    // Use theme to get background color for the container, or use a fixed one
    const { token } = theme.useToken();

    return (
      <div
        data-peer-id={props.peerId}
        style={{
          width: "100%",
          height: "350px", // Fixed height for each peer's canvas
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          background: token.colorBgContainer, // Use theme background
          position: "relative",
          marginBottom: "16px", // Add some margin between peer visualizations
        }}
      >
        <ReactFlowProvider>
          <InnerCanvasAndControls {...props} />
        </ReactFlowProvider>
      </div>
    );
  });
PeerChainVisualization.displayName = "PeerChainVisualization";

export default PeerChainVisualization;
