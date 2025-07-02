import React from 'react';
import { Card, Typography, Tooltip, Button, theme } from 'antd'; // Added Button and theme
import { CheckCircleTwoTone, CloseCircleTwoTone, CloseOutlined } from '@ant-design/icons'; // Added CloseOutlined
import { useTranslation } from 'next-i18next';
import { Handle, Position } from 'reactflow'; // Important for connectors

// const { Text, Title } = Typography; // Remove destructuring

export interface FlowNodeBlockData {
  id: string;
  blockNumber: number;
  nonce: number; // Added nonce
  data: string; // Added data (as string for display)
  currentHash: string;
  previousHash?: string;
  isValid: boolean;
  onClick: () => void;
  onRemove: (id: string) => void;
  isGenesis: boolean;
  // Add any other data needed for display
}

interface FlowNodeBlockProps {
  data: FlowNodeBlockData;
}

const FlowNodeBlock: React.FC<FlowNodeBlockProps> = ({ data }) => {
  const { t } = useTranslation('common');
  const { token } = theme.useToken(); // Get theme tokens

  const abbreviatedHash = (hash: string | undefined) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div
      tabIndex={0}
      className="custom-flow-node"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          data.onClick();
        }
      }}
      style={{ outline: 'none' }} // Remove default browser outline if custom :focus-visible is used
    >
      {/* Handles for incoming and outgoing connections */}
      <Handle type="target" position={Position.Left} style={{ background: token.colorBorder }} /> {/* Updated */}
      <Card
        data-block-id={data.id} // Added data-block-id for tutorial targeting
        // hoverable // Can be removed if focus indication is primary
        size="small"
        style={{
          width: 180,
          height: 130,
          borderColor: data.isValid ? token.colorSuccessBorder : token.colorErrorBorder, // Updated
          borderWidth: '2px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        styles={{ body: { padding: '8px', flexGrow: 1, display: 'flex', flexDirection: 'column' } }}
        onClick={data.onClick} // Keep onClick for mouse users
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <Tooltip title={t('TooltipBlockNumber', 'This is the unique identifier for the block in the chain.')}>
            <Typography.Title level={5} style={{ margin: 0, fontSize: '14px' }}>
              {t('Block', 'Block')} #{data.blockNumber}
            </Typography.Title>
          </Tooltip>
          <Tooltip title={data.isValid ? t('TooltipValidBlock', 'This block is valid.') : t('TooltipInvalidBlock', 'This block is invalid (e.g., tampered data or incorrect nonce).')}>
            {data.isValid ? (
              <CheckCircleTwoTone twoToneColor={token.colorSuccess} style={{ fontSize: '16px' }} /> // Updated
            ) : (
              <CloseCircleTwoTone twoToneColor={token.colorError} style={{ fontSize: '16px' }} /> // Updated
            )}
          </Tooltip>
        </div>
        <Tooltip title={data.currentHash} placement="topLeft">
          <Typography.Text style={{ fontSize: '11px', wordBreak: 'break-all' }} strong>
            <Tooltip title={t('TooltipHash', 'A cryptographic hash uniquely representing this block\'s content and header.')} placement="bottomLeft">
              {t('HashAbbreviation', 'Hash')}:
            </Tooltip>
            {' '}{abbreviatedHash(data.currentHash)}
          </Typography.Text>
        </Tooltip>
        {data.previousHash && (
          <Tooltip title={data.previousHash} placement="topLeft">
            <Typography.Text style={{ fontSize: '10px', wordBreak: 'break-all', marginTop: '4px' }}>
              <Tooltip title={t('TooltipPreviousHash', 'The hash of the preceding block, linking this block to the chain.')} placement="bottomLeft">
                {t('PreviousHashAbbreviation', 'Prev. Hash')}:
              </Tooltip>
              {' '}{abbreviatedHash(data.previousHash)}
            </Typography.Text>
          </Tooltip>
        )}
        <Tooltip title={data.data} placement="bottom">
          <Typography.Text style={{ fontSize: '10px', marginTop: '4px', fontStyle: 'italic', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('DataAbbreviation', 'Data')}: {data.data}
          </Typography.Text>
        </Tooltip>
        <Typography.Text style={{ fontSize: '10px', marginTop: 'auto', paddingTop: '4px', color: token.colorTextTertiary }}> {/* Updated */}
          {t('NonceAbbreviation', 'Nonce')}: {data.nonce}
        </Typography.Text>
        {!data.isGenesis && (
          <Button
            icon={<CloseOutlined />}
            size="small"
            danger
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's onClick from firing
              data.onRemove(data.id);
            }}
            style={{
              position: 'absolute',
              top: '-8px', // Adjust for better visual placement
              right: '-8px', // Adjust
              zIndex: 10, // Ensure it's above other elements
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              minWidth: '20px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={t('RemoveBlockAriaLabel', 'Remove this block')}
          />
        )}
      </Card>
      <Handle type="source" position={Position.Right} style={{ background: token.colorBorder }} /> {/* Updated */}
    </div>
  );
};

export default FlowNodeBlock;
