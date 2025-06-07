import React, { useState, useEffect } from 'react';
import { Tag } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useTranslation } from 'next-i18next';

const NetworkStatusIndicator: React.FC = () => {
  const { t } = useTranslation('common');
  const [isOnline, setIsOnline] = useState(true); // Assume online, then check

  useEffect(() => {
    // Set initial state based on navigator.onLine
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Tag
      color={isOnline ? 'green' : 'red'}
      icon={isOnline ? <WifiOutlined /> : <DisconnectOutlined />}
      style={{ marginRight: 0 }} // Adjust styling as needed, remove default margin if placed in tight spots
    >
      {isOnline ? t('networkStatusOnline', 'Online') : t('networkStatusOffline', 'Offline')}
    </Tag>
  );
};

export default NetworkStatusIndicator;
