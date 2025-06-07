import React from 'react';
import { Card, Typography, Tooltip, Button } from 'antd'; // Added Button
import { CheckCircleTwoTone, CloseCircleTwoTone, CloseOutlined } from '@ant-design/icons'; // Added CloseOutlined
import { useTranslation } from 'next-i18next';
import { Handle, Position } from 'reactflow'; // Important for connectors

const { Text, Title } = Typography;

export interface FlowNodeBlockData {
  id: string;
  blockNumber: number;
  currentHash: string;
  previousHash?: string;
  isValid: boolean;
  onClick: () => void;
  onRemove: (id: string) => void; // Added onRemove
  isGenesis: boolean; // Added isGenesis
  // Add any other data needed for display
}

interface FlowNodeBlockProps {
  data: FlowNodeBlockData;
}

const FlowNodeBlock: React.FC<FlowNodeBlockProps> = ({ data }) => {
  const { t } = useTranslation('common');

  const abbreviatedHash = (hash: string | undefined) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <>
      {/* Handles for incoming and outgoing connections */}
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <Card
        data-block-id={data.id} // Added data-block-id for tutorial targeting
        hoverable
        size="small"
        style={{
          width: 180,
          height: 130,
          borderColor: data.isValid ? '#52c41a' : '#ff4d4f',
          borderWidth: '2px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        bodyStyle={{ padding: '8px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}
        onClick={data.onClick}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <Tooltip title={t('TooltipBlockNumber', 'This is the unique identifier for the block in the chain.')}>
            <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
              {t('Block', 'Block')} #{data.blockNumber}
            </Title>
          </Tooltip>
          <Tooltip title={data.isValid ? t('TooltipValidBlock', 'This block is valid.') : t('TooltipInvalidBlock', 'This block is invalid (e.g., tampered data or incorrect nonce).')}>
            {data.isValid ? (
              <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '16px' }} />
            ) : (
              <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: '16px' }} />
            )}
          </Tooltip>
        </div>
        <Tooltip title={data.currentHash} placement="topLeft">
          <Text style={{ fontSize: '11px', wordBreak: 'break-all' }} strong>
            <Tooltip title={t('TooltipHash', 'A cryptographic hash uniquely representing this block\'s content and header.')} placement="bottomLeft">
              {t('HashAbbreviation', 'Hash')}:
            </Tooltip>
            {' '}{abbreviatedHash(data.currentHash)}
          </Text>
        </Tooltip>
        {data.previousHash && (
          <Tooltip title={data.previousHash} placement="topLeft">
            <Text style={{ fontSize: '10px', wordBreak: 'break-all', marginTop: '4px' }}>
              <Tooltip title={t('TooltipPreviousHash', 'The hash of the preceding block, linking this block to the chain.')} placement="bottomLeft">
                {t('PreviousHashAbbreviation', 'Prev. Hash')}:
              </Tooltip>
              {' '}{abbreviatedHash(data.previousHash)}
            </Text>
          </Tooltip>
        )}
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
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </>
  );
};

export default FlowNodeBlock;
