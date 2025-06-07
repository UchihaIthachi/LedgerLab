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
  useReactFlow, // Import useReactFlow
} from 'reactflow';
import { Button } from 'antd'; // Import Button
import { ExpandAltOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'; // Import an icon & PlusOutlined, ReloadOutlined
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
  onNodeRemove: (id: string) => void; // Added onNodeRemove
  onAddBlock: () => void;           // New prop
  onResetChain: () => void; // New prop
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  chain,
  onNodeClick,
  miningBlockId,
  onNodeRemove,
  onAddBlock, // Destructure new prop
  onResetChain, // Destructure new prop
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeBlockData>([]); // Specify NodeData type
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]); // Specify EdgeData type for useEdgesState
  const { fitView } = useReactFlow(); // Get fitView function

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
        onRemove: onNodeRemove, // Pass onNodeRemove
        isGenesis: index === 0, // Determine if it's the genesis block
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
  }, [chain, onNodeClick, setNodes, setEdges, miningBlockId, onNodeRemove]); // Added onNodeRemove to dependencies

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleFitView = () => {
    fitView({ padding: 0.1, duration: 300 }); // Use padding and optional animation duration
  };

  return (
    <div style={{ width: '100%', height: '70vh', position: 'relative' }}> {/* Added position: relative for positioning button */}
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
        {/* SVG Definitions for Arrowhead Markers */}
        <svg>
          <defs>
            <marker
              id="arrowhead-valid"
              viewBox="-0 -5 10 10"
              refX="10" // Adjust refX so the arrow tip is at the end of the line
              refY="0"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 -5 L 10 0 L 0 5 z" fill="#52c41a" /> {/* z to close path */}
            </marker>
            <marker
              id="arrowhead-invalid"
              viewBox="-0 -5 10 10"
              refX="10" // Adjust refX
              refY="0"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 -5 L 10 0 L 0 5 z" fill="#ff4d4f" /> {/* z to close path */}
            </marker>
             <marker
              id="arrowhead-default" // Fallback or for other types of edges if needed
              viewBox="-0 -5 10 10"
              refX="10"
              refY="0"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 -5 L 10 0 L 0 5 z" fill="#aaa" /> {/* Default color */}
            </marker>
          </defs>
        </svg>
        {/* Add Fit View Button */}
        <div style={{
          position: 'absolute',
          top: '10px', // Adjust as needed
          right: '10px', // Adjust to place near controls
          zIndex: 10, // Ensure it's above the canvas elements but potentially below modal
          display: 'flex', // Added for layout
          gap: '8px' // Added for spacing between buttons
        }}>
          <Button
            icon={<ExpandAltOutlined />}
            onClick={handleFitView}
            title="Fit View" // Tooltip for the button
          />
          <Button
            icon={<PlusOutlined />}
            onClick={onAddBlock}
            title="Add new block" // Static tooltip title
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={onResetChain}
            title="Reset chain to initial state" // Static tooltip title
          />
        </div>
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
