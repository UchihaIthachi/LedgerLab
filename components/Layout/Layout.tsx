import React, { useState, useEffect } from "react";
import { Layout as AntLayout, Menu, Dropdown, Button, Space, ConfigProvider, theme, Switch } from "antd"; // Added Space, ConfigProvider, theme, Switch
import PwaInstallBanner from "../PWA/PwaInstallBanner"; // Import the banner
import NetworkStatusIndicator from "../Common/NetworkStatusIndicator"; // Import NetworkStatusIndicator
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
  SunOutlined, // Icon for light mode
  MoonOutlined, // Icon for dark mode
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import Link from "next/link";

const { Header, Content, Footer, Sider } = AntLayout;

type MenuItemType = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItemType[],
  type?: "group"
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
  const { t } = useTranslation("common");
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Theme state
  const router = useRouter();
  const { locale: currentLocale, locales, pathname, query, asPath } = router;

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showInstallPromptBanner, setShowInstallPromptBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      const dismissed =
        localStorage.getItem("customPwaInstallDismissed") === "true";
      if (!isStandalone && !dismissed) {
        setShowInstallPromptBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallPromptBanner(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Theme persistence useEffect
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to light theme if no preference is found
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      // Add/remove theme classes on documentElement
      if (isDarkMode) {
        document.documentElement.classList.add('theme-dark');
        document.documentElement.classList.remove('theme-light');
      } else {
        document.documentElement.classList.add('theme-light');
        document.documentElement.classList.remove('theme-dark');
      }
    }
  }, [isDarkMode]);

  const handlePwaInstall = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      try {
        const choiceResult = await installPromptEvent.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the PWA installation");
        } else {
          console.log("User dismissed the PWA installation");
        }
      } catch (error) {
        console.error("Error during PWA installation prompt:", error);
      } finally {
        setShowInstallPromptBanner(false);
        setInstallPromptEvent(null);
      }
    } else {
      console.error("PWA install event not available.");
    }
  };

  const handlePwaDismiss = () => {
    localStorage.setItem("customPwaInstallDismissed", "true");
    setShowInstallPromptBanner(false);
  };

  const languageMap: { [key: string]: string } = {
    en: "English",
    de: "Deutsch",
    es: "Español",
    "fr-CA": "Français (CA)",
    "fr-FR": "Français (FR)",
    hi: "हिन्दी",
    hu: "Magyar",
    id: "Indonesia",
    ja: "日本語",
    ko: "한국어",
    nl: "Nederlands",
    pl: "Polski",
    pt: "Português",
    "zh-CN": "简体中文",
  };

  const menuItems: MenuItemType[] = [
    getItem(
      t("BlockchainSectionTitle", "Blockchain"),
      "/blockchain",
      <AppstoreOutlined />,
      [
        getItem(
          t("Block", "Single Block"),
          "/blockchain/block",
          <GoldOutlined />
        ),
        getItem(
          t("Blockchain", "Chain View"),
          "/blockchain",
          <PieChartOutlined />
        ),
        getItem(
          t("Distributed", "Distributed"),
          "/blockchain/distributed",
          <BranchesOutlined />
        ),
        getItem(
          t("Tokens", "Tokens"),
          "/blockchain/tokens",
          <DollarCircleOutlined />
        ),
        getItem(
          t("Coinbase", "Coinbase"),
          "/blockchain/coinbase",
          <GiftOutlined />
        ),
      ]
    ),
    getItem(
      t("PPKSectionTitle", "Public/Private Key Cryptography"),
      "/public-private-key",
      <KeyOutlined />,
      [
        getItem(
          t("KeysFeatureName", "Key Pair Generation"),
          "/public-private-key/keys",
          <KeyOutlined />
        ),
        getItem(
          t("SignaturesFeatureName", "Digital Signatures"),
          "/public-private-key/signatures",
          <SignatureOutlined />
        ),
        getItem(
          t("TransactionSigningTitle", "Transaction Signing"),
          "/public-private-key/transaction",
          <TransactionOutlined />
        ),
      ]
    ),
    getItem(
      t("ZeroKnowledgeProof", "Zero Knowledge"),
      "/zero-knowledge-proof",
      <UserOutlined />
    ), // Placeholder path
  ];

  const handleMenuClick = (e: any) => {
    router.push(e.key);
  };

  const handleLanguageMenuClick = ({ key }: { key: string }) => {
    router.push({ pathname, query }, asPath, { locale: key });
  };

  const languageMenuItems = locales?.map((l) => ({
    key: l,
    label: languageMap[l] || l.toUpperCase(),
  }));

  const openSubMenuKeys = menuItems
    .filter(
      (item) =>
        item &&
        item.children &&
        item.children.some(
          (child) => child && pathname.startsWith(child.key as string)
        )
    )
    .map((item) => item?.key as string);

  // If on a top-level path that is also a submenu key, ensure it's open
  if (
    menuItems.some((item) => item && item.key === pathname && item.children)
  ) {
    if (!openSubMenuKeys.includes(pathname)) {
      openSubMenuKeys.push(pathname);
    }
  }

  const selectedKey = pathname;

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntLayout style={{ minHeight: "100vh" }}>
        <Sider
          collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <Link href="/" passHref>
          <div
            style={{
              height: "32px",
              margin: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {collapsed ? t("BD_Short", "BD") : t("Blockchain Demo")}
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
        <Header
          style={{
            padding: "0 16px",
            background: "var(--header-background)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderBottom: '1px solid var(--border-color-standard)', // Added
          }}
        >
          <Space>
            <NetworkStatusIndicator />
            <Button
              onClick={toggleTheme}
              icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              title={isDarkMode ? t('switchToLightMode', 'Switch to Light Mode') : t('switchToDarkMode', 'Switch to Dark Mode')}
              type="text"
              style={{ marginRight: '8px' }} // Adjusted margin slightly
            />
            <Dropdown
              menu={{
                items: languageMenuItems,
                onClick: handleLanguageMenuClick,
              }}
              placement="bottomRight"
            >
              <Button icon={<GlobalOutlined />}>
                {currentLocale
                  ? languageMap[currentLocale] || currentLocale.toUpperCase()
                  : ""}
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: "var(--content-background)",
              marginTop: 16,
              borderRadius: 'var(--border-radius)', // Added
            }}
          >
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: "center", borderTop: '1px solid var(--border-color-standard)' }}> {/* Added borderTop */}
          {t("FooterText", "Blockchain Demo Reimagined")} ©
          {new Date().getFullYear()}
        </Footer>
      </AntLayout>
      <PwaInstallBanner
        isVisible={showInstallPromptBanner}
        onInstall={handlePwaInstall}
        onDismiss={handlePwaDismiss}
      />
    </AntLayout>
    </ConfigProvider>
  );
};

export default AppLayout;
