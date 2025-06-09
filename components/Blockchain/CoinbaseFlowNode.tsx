import React from 'react';
import { Card, Typography, Tooltip, Tag, theme } from 'antd'; // Added theme
import { CheckCircleTwoTone, CloseCircleTwoTone, GoldTwoTone, SwapOutlined } from '@ant-design/icons';
import { Handle, Position } from 'reactflow';
import { useTranslation } from 'next-i18next';
// Assuming types are correctly imported or defined if not using a central types/tutorial.ts for these specific types
// For this component, we'll assume BlockType from blockchainUtils includes coinbase and transactions array
import { BlockType as GenericBlockType, CoinbaseTransactionType, TransactionType } from '@/lib/blockchainUtils';

// const { Text, Title } = Typography; // Remove destructuring

// Define a more specific type for the data prop based on GenericBlockType
// This helps ensure the component receives what it expects.
// The 'transactions' field from GenericBlockType is assumed to be the P2P transactions.
// The 'coinbase' field is already part of GenericBlockType.
export interface CoinbaseFlowNodeData extends Omit<GenericBlockType, 'data' | 'id'> {
  // React Flow specific ID, different from block's own data ID if necessary
  id: string;
  // Explicitly define fields expected by this node, derived from BlockType
  p2pTransactions?: TransactionType[]; // Use this if BlockType.data is a union
  onClick: () => void;
  // 'data-block-id' for DOM targeting, using the block's actual data ID from chain
  'data-block-id': string;
}


interface CoinbaseFlowNodeProps {
  data: CoinbaseFlowNodeData;
}

const CoinbaseFlowNode: React.FC<CoinbaseFlowNodeProps> = ({ data }) => {
  const { t } = useTranslation('common');
  const { token } = theme.useToken(); // Get theme tokens

  const abbreviatedHash = (hash: string | undefined | null): string => {
    if (typeof hash === 'string' && hash.length > 10) {
      return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    }
    if (typeof hash === 'string') {
      return hash;
    }
    return 'N/A';
  };

  const p2pTxCount = data.p2pTransactions?.length || 0;

  return (
    // Use data['data-block-id'] which should be the original block.id for targeting
    <div
      data-block-id={data['data-block-id']}
      tabIndex={0}
      className="custom-coinbase-node"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          data.onClick();
        }
      }}
      style={{ outline: 'none' }} // Remove default browser outline if custom :focus-visible is used
    >
      <Handle type="target" position={Position.Left} style={{ background: token.colorBorder }} />
      <Card
        // hoverable // Can be removed if focus indication is primary
        size="small"
        style={{
          width: 200,
          borderColor: data.isValid ? token.colorSuccessBorder : token.colorErrorBorder,
          borderWidth: '2px',
        }}
        bodyStyle={{ padding: '8px', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} // Ensure consistent height
        onClick={data.onClick}
        title={
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Tooltip title={t('TooltipBlockNumber', 'This is the unique identifier for the block in the chain.')}>
              <Typography.Title level={5} style={{ margin: 0, fontSize: '14px' }}>
                {t('Block', 'Block')} #{data.blockNumber}
              </Typography.Title>
            </Tooltip>
            <Tooltip title={data.isValid ? t('TooltipValidBlock', 'This block is valid.') : t('TooltipInvalidBlock', 'This block is invalid.')}>
              {data.isValid ? (
                <CheckCircleTwoTone twoToneColor={token.colorSuccess} style={{ fontSize: '16px' }} />
              ) : (
                <CloseCircleTwoTone twoToneColor={token.colorError} style={{ fontSize: '16px' }} />
              )}
            </Tooltip>
          </div>
        }
      >
        <div> {/* Content wrapper for hashes */}
          <Tooltip title={data.currentHash} placement="topLeft">
            <Typography.Text style={{ fontSize: '11px', wordBreak: 'break-all', display: 'block', marginBottom: '4px' }} strong>
              <Tooltip title={t('TooltipHash', 'A cryptographic hash uniquely representing this block\'s content and header.')} placement="bottomLeft">
                {t('HashAbbreviation', 'Hash')}:
              </Tooltip>
              {' '}{abbreviatedHash(data.currentHash)}
            </Typography.Text>
          </Tooltip>
          {data.previousHash && (
             <Tooltip title={data.previousHash} placement="topLeft">
                <Typography.Text style={{ fontSize: '10px', wordBreak: 'break-all', display: 'block', marginBottom: '8px' }}>
                  <Tooltip title={t('TooltipPreviousHash', 'The hash of the preceding block, linking this block to the chain.')} placement="bottomLeft">
                    {t('PreviousHashAbbreviation', 'Prev. Hash')}:
                  </Tooltip>
                 {' '}{abbreviatedHash(data.previousHash)}
                </Typography.Text>
            </Tooltip>
          )}
        </div>
        <div style={{textAlign: 'center', marginTop: 'auto'}}> {/* Tx info pushed to bottom */}
          {data.coinbaseTx && (
            <Tag icon={<GoldTwoTone />} color="gold" style={{ marginBottom: '4px', display: 'block' }}> {/* AntD gold tag should be theme aware */}
              {t('CoinbaseTxShort', 'Coinbase Rewarded')}
            </Tag>
          )}
          <Tag icon={<SwapOutlined />} color="blue" style={{display: 'block'}}> {/* AntD blue tag should be theme aware */}
            {p2pTxCount} {t(p2pTxCount === 1 ? 'P2PTxShortSingular' : 'P2PTxShortPlural', `${p2pTxCount} P2P Tx(s)`)}
          </Tag>
        </div>
      </Card>
      <Handle type="source" position={Position.Right} style={{ background: token.colorBorder }} />
    </div>
  );
};

export default CoinbaseFlowNode;
