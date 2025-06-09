import React from 'react';
import { Tooltip, Typography } from 'antd';
import { useTranslation } from 'next-i18next';

const { Text } = Typography;

interface GlossaryTermProps {
  termKey: string;
  children?: React.ReactNode; // Allow children to override default term display
}

const GlossaryTerm: React.FC<GlossaryTermProps> = ({ termKey, children }) => {
  const { t } = useTranslation('common');

  const term = t(`glossary_${termKey}`, { defaultValue: termKey });
  const definition = t(`glossary_${termKey}_def`, { defaultValue: 'Definition not found.' });

  // Default display for the term, can be overridden by children
  const displayTerm = children || term;

  return (
    <Tooltip title={definition}>
      <Text
        style={{
          borderBottom: '1px dotted currentColor',
          cursor: 'help',
          // Add any other specific styling, e.g., color
          // color: '#1890ff', // Example: Ant Design's primary color
        }}
      >
        {displayTerm}
      </Text>
    </Tooltip>
  );
};

export default GlossaryTerm;
