import React from "react";
import { Button, Typography, Space } from "antd";
import { useTranslation } from "next-i18next";

interface PwaInstallBannerProps {
  isVisible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  isVisible,
  onInstall,
  onDismiss,
}) => {
  const { t } = useTranslation("common");

  if (!isVisible) {
    return null;
  }

  const bannerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    right: "20px",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "16px",
    background: "#f0f2f5",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "8px",
  };

  const textStyle: React.CSSProperties = {
    marginRight: "16px", // Add some space between text and buttons
  };

  return (
    <div style={bannerStyle}>
      <Typography.Text style={textStyle}>
        {t(
          "pwaInstallPromptMessage",
          "Install this app to your device for the best experience!"
        )}
      </Typography.Text>
      <Space>
        <Button type="primary" onClick={onInstall}>
          {t("pwaInstallButton", "Install")}
        </Button>
        <Button onClick={onDismiss}>{t("pwaDismissButton", "Later")}</Button>
      </Space>
    </div>
  );
};

export default PwaInstallBanner;
