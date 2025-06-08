import React from 'react';
import { Card, Form, Input, Button, InputNumber, Descriptions, Typography, Divider } from 'antd'; // Added Divider
import { useTranslation } from 'next-i18next';
import { TransactionType, CoinbaseTransactionType } from '@/lib/blockchainUtils'; // Import types

const { Text } = Typography;

interface BlockCardProps {
  blockNumber: number;
  nonce: number;
  coinbase?: CoinbaseTransactionType; // New prop for coinbase transaction
  data: TransactionType[] | string;
  dataType?: 'transactions' | 'simple_text';
  previousHash?: string;
  currentHash: string;
  isValid: boolean;
  onDataChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onNonceChange: (value: string | number | null | undefined) => void;
  onMine: () => void;
  isMining: boolean;
  isFirstBlock?: boolean;
  // For coinbase editing, if implemented on parent page:
  onCoinbaseFieldChange?: (field: keyof CoinbaseTransactionType, value: string) => void;
}

const BlockCard: React.FC<BlockCardProps> = ({
  blockNumber,
  nonce,
  coinbase, // Destructure new prop
  data,
  dataType = 'simple_text',
  previousHash = "0".repeat(64),
  currentHash,
  isValid,
  onDataChange,
  onNonceChange,
  onMine,
  isMining,
  isFirstBlock = false,
  onCoinbaseFieldChange, // Placeholder
}) => {
  const { t } = useTranslation('common');
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({
      blockNumber,
      nonce,
      data: typeof data === 'string' ? data : '',
      previousHash: isFirstBlock && previousHash === "0".repeat(64) ? "" : previousHash,
      currentHash,
      // Coinbase fields are not part of this antd form directly, displayed separately
    });
  }, [blockNumber, nonce, data, previousHash, currentHash, form, isFirstBlock]);

  const cardStyle: React.CSSProperties = {
    marginBottom: '20px',
    borderColor: isValid ? '#52c41a' : '#ff4d4f',
    borderWidth: '2px',
  };

  const cardBodyStyle: React.CSSProperties = {
    backgroundColor: isValid ? 'rgba(82, 196, 26, 0.05)' : 'rgba(255, 77, 79, 0.05)',
  };

  const renderCoinbaseSection = () => {
    if (!coinbase) return null;
    return (
      <>
        <Form.Item label={t('CoinbaseTransaction', 'Coinbase Transaction')}>
          <Card size="small" type="inner">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t('To', 'To')}>{coinbase.to}</Descriptions.Item>
              <Descriptions.Item label={t('Value', 'Value (Minted)')}>{coinbase.value.toString()}</Descriptions.Item>
            </Descriptions>
            {/* Example for editable coinbase, parent would handle state & callback */}
            {/* {onCoinbaseFieldChange && (
              <Space style={{marginTop: '5px'}}>
                  <Input size="small" value={coinbase.to} onChange={e => onCoinbaseFieldChange('to', e.target.value)} placeholder="To"/>
                  <InputNumber size="small" value={Number(coinbase.value)} onChange={val => onCoinbaseFieldChange('value', val?.toString() ?? '')} placeholder="Value"/>
              </Space>
            )} */}
          </Card>
        </Form.Item>
        <Divider dashed />
      </>
    );
  };

  const renderDataSection = () => {
    if (dataType === 'transactions' && Array.isArray(data)) {
      return (
        <Form.Item label={t('P2PTransactions', 'P2P Transactions')}>
          {data.length === 0 ? <Text italic>{t('NoTransactions', '(No transactions)')}</Text> : null}
          {data.map((tx, index) => (
            <Card key={tx.id || index} size="small" style={{ marginTop: index > 0 ? '10px' : '0' }} type="inner">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={t('From', 'From')}>{tx.from}</Descriptions.Item>
                <Descriptions.Item label={t('To', 'To')}>{tx.to}</Descriptions.Item>
                <Descriptions.Item label={t('Value', 'Value')}>{tx.value.toString()}</Descriptions.Item>
              </Descriptions>
            </Card>
          ))}
        </Form.Item>
      );
    }
    return (
      <Form.Item label={t('Data')} name="data">
        <Input.TextArea
          rows={4}
          onChange={onDataChange}
          disabled={dataType === 'transactions'}
        />
      </Form.Item>
    );
  };

  return (
    <Card title={`${t('Block')} #${blockNumber}`} style={cardStyle} styles={{ body: cardBodyStyle }}>
      <Form form={form} layout="vertical">
        <Form.Item label={t('BlockNumberLabel', 'Block #')} name="blockNumber">
          <InputNumber readOnly style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label={t('Nonce')} name="nonce">
          <InputNumber
            value={nonce}
            onChange={onNonceChange}
            style={{ width: '100%' }}
            min={0}
          />
        </Form.Item>
        {renderCoinbaseSection()}
        {renderDataSection()}
        <Form.Item label={t('Prev')} name="previousHash">
          <Input readOnly disabled={isFirstBlock && previousHash === "0".repeat(64)} />
        </Form.Item>
        <Form.Item label={t('Hash')} name="currentHash">
          <Input readOnly />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={onMine}
            loading={isMining}
            block
            tooltip={{ title: t('MineButtonTooltip', "Click to find a new nonce that makes this block's hash valid (starts with '0000').") }}
            data-testid="mine-button-in-modal" // Added for tutorial targeting
          >
            {t('Mine', 'Mine')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BlockCard;
