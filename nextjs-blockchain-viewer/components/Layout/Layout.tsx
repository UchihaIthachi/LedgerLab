import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Button } from 'antd';
import {
  DesktopOutlined,
  PieChartOutlined,
  UserOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  GoldOutlined,
  BranchesOutlined,
  DollarCircleOutlined,
  GiftOutlined,
  KeyOutlined, // Icon for PKI section
  SignatureOutlined, // Icon for Signatures
  TransactionOutlined, // Icon for PKI Transaction (optional)
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';

const { Header, Content, Footer, Sider } = AntLayout;

type MenuItemType = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItemType[],
  type?: 'group',
): MenuItemType {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItemType;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { locale: currentLocale, locales, pathname, query, asPath } = router;

  const menuItems: MenuItemType[] = [
    getItem(t('BlockchainSectionTitle', 'Blockchain'), '/blockchain', <AppstoreOutlined />, [
      getItem(t('Block', 'Single Block'), '/blockchain/block', <GoldOutlined />),
      getItem(t('Blockchain', 'Chain View'), '/blockchain', <PieChartOutlined />),
      getItem(t('Distributed', 'Distributed'), '/blockchain/distributed', <BranchesOutlined />),
      getItem(t('Tokens', 'Tokens'), '/blockchain/tokens', <DollarCircleOutlined />),
      getItem(t('Coinbase', 'Coinbase'), '/blockchain/coinbase', <GiftOutlined />),
    ]),
    getItem(t('PPKSectionTitle', 'Public/Private Key'), '/public-private-key', <KeyOutlined />, [
      getItem(t('KeysFeatureName', 'Key Pair Generation'), '/public-private-key/keys', <KeyOutlined />),
      getItem(t('SignaturesFeatureName', 'Digital Signatures'), '/public-private-key/signatures', <SignatureOutlined />),
      getItem(t('TransactionSigningTitle', 'Transaction Signing'), '/public-private-key/transaction', <TransactionOutlined />),
    ]),
    getItem(t('ZeroKnowledgeProof', 'Zero Knowledge'), '/zero-knowledge-proof', <UserOutlined />), // Placeholder path
  ];

  const handleMenuClick = (e: any) => {
    router.push(e.key);
  };

  const languageMenu = (
    <Menu onClick={({ key }) => router.push({ pathname, query }, asPath, { locale: key })}>
      {locales?.map((l) => (
        <Menu.Item key={l}>{l.toUpperCase()}</Menu.Item>
      ))}
    </Menu>
  );

  const openSubMenuKeys = menuItems
    .filter(item => item && item.children && item.children.some(child => child && pathname.startsWith(child.key as string)))
    .map(item => item?.key as string);

  // If on a top-level path that is also a submenu key, ensure it's open
  if (menuItems.some(item => item && item.key === pathname && item.children)) {
    if (!openSubMenuKeys.includes(pathname)) {
      openSubMenuKeys.push(pathname);
    }
  }

  const selectedKey = pathname;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <Link href="/" passHref>
          <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
            {collapsed ? t('BD_Short', 'BD') : t('Blockchain Demo')}
          </div>
        </Link>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openSubMenuKeys} // Use this for dynamically opening based on current path
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout className="site-layout">
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} >
          <Dropdown overlay={languageMenu} placement="bottomRight">
            <Button icon={<GlobalOutlined />}>
              {currentLocale?.toUpperCase()}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff', marginTop: 16 }}>
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          {t('FooterText', 'Blockchain Demo Reimagined')} ©{new Date().getFullYear()}
        </Footer>
      </AntLayout>
    </AntLayout>
  );
};

export default AppLayout;
