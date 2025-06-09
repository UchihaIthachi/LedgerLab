import React from 'react';
import { Card, Typography, Tooltip } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { useTranslation } from 'next-i18next';

const { Text, Title } = Typography;

interface CompactBlockCardProps {
  blockNumber: number;
  currentHash: string;
  previousHash?: string; // Optional for display
  isValid: boolean;
  onClick: () => void;
}

const CompactBlockCard: React.FC<CompactBlockCardProps> = ({
  blockNumber,
  currentHash,
  previousHash,
  isValid,
  onClick,
}) => {
  const { t } = useTranslation('common');

  const abbreviatedHash = (hash: string | undefined) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <Card
      hoverable
      size="small"
      style={{
        width: 180,
        height: 130, // Adjusted for a bit more content if prevHash is shown
        borderColor: isValid ? 'var(--color-success-border)' : 'var(--color-error-border)',
        borderWidth: '1px', // Changed from 2px to 1px
        boxShadow: 'var(--box-shadow-standard)', // Added boxShadow
        borderRadius: 'var(--border-radius)', // Added borderRadius
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      bodyStyle={{ padding: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column' }} // Changed padding from 8px to 12px
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
          {t('Block', 'Block')} #{blockNumber}
        </Title>
        {isValid ? (
          <CheckCircleTwoTone twoToneColor="var(--color-success-border)" style={{ fontSize: '16px' }} />
        ) : (
          <CloseCircleTwoTone twoToneColor="var(--color-error-border)" style={{ fontSize: '16px' }} />
        )}
      </div>
      <Tooltip title={currentHash} placement="topLeft">
        <Text style={{ fontSize: '11px', wordBreak: 'break-all' }}>
          <Text type="secondary">{t('HashAbbreviation', 'Hash')}: </Text>
          <Text strong>{abbreviatedHash(currentHash)}</Text>
        </Text>
      </Tooltip>
      {previousHash && ( // Conditionally display previous hash if provided and space allows
         <Tooltip title={previousHash} placement="topLeft">
            <Text style={{ fontSize: '10px', wordBreak: 'break-all', marginTop: '4px' }}>
              <Text type="secondary">{t('PreviousHashAbbreviation', 'Prev. Hash')}: </Text>
              <Text strong>{abbreviatedHash(previousHash)}</Text>
            </Text>
        </Tooltip>
      )}
    </Card>
  );
};

export default CompactBlockCard;
