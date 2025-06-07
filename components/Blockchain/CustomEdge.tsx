import React from 'react';
import { getBezierPath, EdgeProps, EdgeLabelRenderer } from 'reactflow';
import { useTranslation } from 'next-i18next';
import { Tooltip } from 'antd'; // Add Tooltip import

export interface CustomEdgeData {
  isValid?: boolean; // To control styling based on chain validity
  isAnimating?: boolean; // To control animation
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  // markerEnd, // We'll set this dynamically on the path itself
}) => {
  const { t } = useTranslation('common');
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { isValid = true, isAnimating = false } = data || {};

  const edgeStyle = {
    strokeWidth: isValid ? 3 : 2, // Thicker for valid, thinner for invalid/broken
    stroke: isValid ? '#52c41a' : '#ff4d4f', // Green for valid, Red for invalid
    ...(isAnimating && {
      animation: 'pulse 2s infinite',
    }),
    ...style, // Allow overriding with other styles
  };

  const determinedMarkerEnd = isValid ? 'url(#arrowhead-valid)' : 'url(#arrowhead-invalid)';

  // Basic CSS for pulsing animation (can be added to a global CSS file or a style tag)
  // @keyframes pulse {
  //   0% { opacity: 1; }
  //   50% { opacity: 0.5; }
  //   100% { opacity: 1; }
  // }

  const edgePathComponent = (
    <path
      id={id}
      style={edgeStyle}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={determinedMarkerEnd} // Dynamically set marker
    />
  );

  if (!isValid) {
    return (
      <Tooltip title={t('InvalidLinkTooltip', 'Link broken: Previous hash mismatch. Try re-mining the preceding block or check data integrity.')}>
        <g> {/* Grouping element for tooltip events */}
          {edgePathComponent}
        </g>
      </Tooltip>
    );
  }

  return <>{edgePathComponent}</>; // Render path directly if valid
      {/* Optional: Add a label to the edge, e.g., to indicate status */}
      {/* {!isValid && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              background: '#ff4d4f',
              color: 'white',
              padding: '2px 4px',
              borderRadius: '3px',
            }}
            className="nodrag nopan"
          >
            {t('InvalidLink', 'Broken Link')}
          </div>
        </EdgeLabelRenderer>
      )} */}
    </>
  );
};

export default CustomEdge;
