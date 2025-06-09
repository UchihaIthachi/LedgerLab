import React from 'react';
import { Modal, Button as AntButton, Card, Space, Input, InputNumber, Typography } from 'antd';
import { useTranslation } from 'next-i18next';
import { BlockType, TransactionType, CoinbaseTransactionType } from '@/lib/blockchainUtils';
import BlockCard from './BlockCard';

export interface BlockDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedBlockInfo: { peerId?: string; block: BlockType } | null;
  miningState?: boolean;
  onMine?: () => void;
  onNonceChange: (newNonce: string | number | null | undefined) => void;

  // Handlers for data changes based on block type
  onSimpleDataChange?: (newData: string) => void; // For 'simple_text' type blocks
  onCoinbaseChange?: (field: keyof CoinbaseTransactionType, value: any) => void;
  onP2PTransactionChange?: (txId: string, field: keyof TransactionType, value: any) => void;

  blockDataType: 'simple_text' | 'transactions_with_coinbase' | 'transactions_only';

  // Optional: if we need to apply temporary edits from modal state
  editingTxState?: { [txId: string]: Partial<TransactionType> };
  onApplyP2PTxChanges?: (txId: string) => void;
  editingCoinbaseState?: { [blockId: string]: Partial<CoinbaseTransactionType> }; // blockId here is the actual block.id
  onApplyCoinbaseChanges?: () => void;
  miningAttemptNonce?: number;
  miningAttemptHash?: string;
}

const BlockDetailModal: React.FC<BlockDetailModalProps> = (props) => {
  const { t } = useTranslation('common');
  const {
    visible,
    onClose,
    selectedBlockInfo,
    miningState,
    onMine,
    onNonceChange,
    onSimpleDataChange,
    onCoinbaseChange,
    onP2PTransactionChange,
    blockDataType,
    editingTxState = {}, // Default to empty object
    onApplyP2PTxChanges,
    editingCoinbaseState = {}, // Default to empty object
    onApplyCoinbaseChanges,
    miningAttemptNonce,
    miningAttemptHash,
  } = props;

  if (!selectedBlockInfo) {
    return null; // Or an empty modal structure if preferred
  }

  const { block, peerId } = selectedBlockInfo;

  const blockCardDataType =
    blockDataType === 'simple_text' ? 'simple_text' : 'transactions';

  const modalTitle = `${t('BlockDetailsTitle', 'Block Details')} - ${
    peerId ? `${t('Peer', 'Peer')} ${peerId} - ` : ''
  }${t('Block', 'Block')} #${block.blockNumber}`;

  return (
    <Modal
      title={modalTitle}
      visible={visible}
      onOk={onClose}
      onCancel={onClose}
      width={800}
      footer={[<AntButton key="close" onClick={onClose}>{t('CloseButton', 'Close')}</AntButton>]}
    >
      <BlockCard
        blockNumber={block.blockNumber}
        nonce={block.nonce}
        coinbase={block.coinbase} // Pass coinbase if it exists
        data={blockDataType === 'simple_text' ? (block.data as string) : (block.data as TransactionType[])}
        dataType={blockCardDataType}
        previousHash={block.previousHash}
        currentHash={block.currentHash}
        isValid={block.isValid}
        onDataChange={blockDataType === 'simple_text' && onSimpleDataChange ? (e) => onSimpleDataChange(e.target.value) : undefined}
        onNonceChange={onNonceChange}
        onMine={onMine}
        isMining={miningState}
        isFirstBlock={block.blockNumber === 1}
        miningAttemptNonce={miningAttemptNonce}
        miningAttemptHash={miningAttemptHash}
      />

      {blockDataType === 'transactions_with_coinbase' && block.coinbase && onCoinbaseChange && (
        <Card size="small" key={`${block.id}-cb-edit-modal`} style={{ marginTop: "10px" }}> {/* Removed backgroundColor */}
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Text strong>{t("EditCoinbaseTx", "Edit Coinbase Tx")}</Typography.Text>
            <Input
              addonBefore={t("To")}
              value={editingCoinbaseState[block.id]?.to ?? block.coinbase.to}
              onChange={(e) => onCoinbaseChange("to", e.target.value)}
            />
            <InputNumber
              addonBefore={t("ValueMinted", "Value (Minted)")}
              value={Number(editingCoinbaseState[block.id]?.value ?? block.coinbase.value)}
              onChange={(value) => onCoinbaseChange("value", value ?? 0)}
              style={{ width: "100%" }}
              min={0}
            />
            {onApplyCoinbaseChanges && (
                 <AntButton onClick={onApplyCoinbaseChanges} type="dashed" size="small">
                    {t("ApplyCoinbaseChanges", "Apply Coinbase Changes")}
                 </AntButton>
            )}
          </Space>
        </Card>
      )}

      {(blockDataType === 'transactions_with_coinbase' || blockDataType === 'transactions_only') && Array.isArray(block.data) && block.data.length > 0 && onP2PTransactionChange && (
        <Card size="small" key={`${block.id}-p2p-edit-modal`} style={{ marginTop: "10px" }}> {/* Removed backgroundColor */}
          <Typography.Text strong>{t("EditP2PTxs", "Edit P2P Txs")}</Typography.Text>
          {(block.data as TransactionType[]).map((tx, txIndex) => (
            <Space
              direction="vertical"
              key={tx.id}
              style={{ width: "100%", marginTop: "10px", paddingTop: "10px", borderTop: txIndex > 0 ? "1px dashed var(--border-color-standard)" : "none" }}
              data-p2p-tx-index={txIndex} // For tutorial targeting
            >
              <Input
                addonBefore={t("From")}
                value={editingTxState[tx.id]?.from ?? tx.from}
                onChange={(e) => onP2PTransactionChange(tx.id, "from", e.target.value)}
                data-field-name="from" // For tutorial targeting
              />
              <Input
                addonBefore={t("To")}
                value={editingTxState[tx.id]?.to ?? tx.to}
                onChange={(e) => onP2PTransactionChange(tx.id, "to", e.target.value)}
                data-field-name="to" // For tutorial targeting
              />
              <InputNumber
                addonBefore={t("Value")}
                value={Number(editingTxState[tx.id]?.value ?? tx.value)}
                onChange={(value) => onP2PTransactionChange(tx.id, "value", value ?? 0)}
                style={{ width: "100%" }}
                min={0}
                data-field-name="value" // For tutorial targeting
              />
              {onApplyP2PTxChanges && (
                <AntButton onClick={() => onApplyP2PTxChanges(tx.id)} type="dashed" size="small">
                  {t("ApplyTxChanges", "Apply Changes to Tx")} {tx.id.substring(0, 4)}...
                </AntButton>
              )}
            </Space>
          ))}
        </Card>
      )}
    </Modal>
  );
};

export default BlockDetailModal;
