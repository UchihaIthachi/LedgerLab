import React, { useState } from 'react';
import { Tooltip, Button, Typography } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

interface CopyableTextProps {
  textToCopy: string;
  displayText?: string;
}

const CopyableText: React.FC<CopyableTextProps> = ({ textToCopy, displayText }) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setError(false);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setError(true);
      setCopied(false);
      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Typography.Text style={{ marginRight: 8 }} title={textToCopy}>
        {displayText || textToCopy}
      </Typography.Text>
      <Tooltip title={error ? 'Failed to copy!' : copied ? 'Copied!' : 'Copy'}>
        <Button
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          type="text"
          size="small"
          danger={error}
        />
      </Tooltip>
    </span>
  );
};

export default CopyableText;
