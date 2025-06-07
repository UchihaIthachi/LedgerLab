import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node, // Keep Node for type definition
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FlowNodeBlock, { FlowNodeBlockData } from './FlowNodeBlock'; // Adjust path as needed
import CustomEdge, { CustomEdgeData } from './CustomEdge'; // Adjust path
import { BlockType } from '@/lib/blockchainUtils'; // Assuming BlockType is exported

// Define nodeTypes
const nodeTypes = {
  blockNode: FlowNodeBlock,
};

// Define edgeTypes
const edgeTypes = {
  customEdge: CustomEdge,
};

interface WhiteboardCanvasProps {
  chain: BlockType[];
  onNodeClick: (block: BlockType) => void;
  miningBlockId?: string | null; // ID of the block currently being mined
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ chain, onNodeClick, miningBlockId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeBlockData>([]); // Specify NodeData type
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]); // Specify EdgeData type for useEdgesState

  useEffect(() => {
    const newNodes: Node<FlowNodeBlockData>[] = chain.map((block, index) => ({
      id: block.id,
      type: 'blockNode', // Custom node type
      position: { x: index * 250, y: 100 }, // Basic horizontal layout
      data: {
        id: block.id,
        blockNumber: block.blockNumber,
        currentHash: block.currentHash,
        previousHash: block.previousHash,
        isValid: block.isValid,
        onClick: () => onNodeClick(block),
      },
    }));

    const newEdges: Edge<CustomEdgeData>[] = []; // Specify EdgeData type
    for (let i = 0; i < chain.length - 1; i++) {
      const sourceBlock = chain[i];
      const targetBlock = chain[i+1];

      // Determine if the link is valid
      const isLinkValid = sourceBlock.currentHash === targetBlock.previousHash;
      const isEdgeRelatedToMining = sourceBlock.id === miningBlockId || targetBlock.id === miningBlockId;

      newEdges.push({
        id: `edge-${sourceBlock.id}-to-${targetBlock.id}`,
        source: sourceBlock.id,
        target: targetBlock.id,
        type: 'customEdge', // Use the custom edge type
        data: {
          isValid: isLinkValid,
          isAnimating: isEdgeRelatedToMining, // Animate if related to the block being mined
        },
        // markerEnd: { type: MarkerType.ArrowClosed }, // Optional arrow marker
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [chain, onNodeClick, setNodes, setEdges, miningBlockId]); // Added miningBlockId to dependencies

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '70vh' }}> {/* Adjust height as needed */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes} // Pass nodeTypes
        edgeTypes={edgeTypes} // Pass edgeTypes
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

const WhiteboardWrapper: React.FC<WhiteboardCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WhiteboardCanvas {...props} />
  </ReactFlowProvider>
);

export default WhiteboardWrapper;
