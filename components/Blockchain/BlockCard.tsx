import React from "react";
import {
  Card,
  Form,
  Input,
  Button,
  InputNumber,
  Descriptions,
  Typography,
  Divider,
  theme,
  Empty,
  Tooltip,
} from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons"; // Import icons for title
import { useTranslation } from "next-i18next";
import {
  TransactionType,
  CoinbaseTransactionType,
} from "@/lib/blockchainUtils";
import CopyableText from "@/components/Common/CopyableText"; // Import the new component
import GlossaryTerm from "@/components/Common/GlossaryTerm"; // Import GlossaryTerm

// const { Text } = Typography; // Remove this line

interface BlockCardProps {
  blockNumber: number;
  nonce: number;
  coinbase?: CoinbaseTransactionType; // New prop for coinbase transaction
  data: TransactionType[] | string;
  dataType?: "transactions" | "simple_text";
  previousHash?: string;
  currentHash: string;
  isValid: boolean;
  onDataChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onNonceChange: (value: string | number | null | undefined) => void;
  onMine: () => void;
  isMining: boolean;
  isFirstBlock?: boolean;
  // For coinbase editing, if implemented on parent page:
  onCoinbaseFieldChange?: (
    field: keyof CoinbaseTransactionType,
    value: string
  ) => void;
  miningAttemptNonce?: number;
  miningAttemptHash?: string;
}

const BlockCard: React.FC<BlockCardProps> = ({
  blockNumber,
  nonce,
  coinbase, // Destructure new prop
  data,
  dataType = "simple_text",
  previousHash = "0".repeat(64),
  currentHash,
  isValid,
  onDataChange,
  onNonceChange,
  onMine,
  isMining,
  isFirstBlock = false,
  onCoinbaseFieldChange, // Placeholder
  miningAttemptNonce,
  miningAttemptHash,
}) => {
  const { t } = useTranslation("common");
  const { token } = theme.useToken(); // Get theme tokens
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({
      blockNumber,
      nonce,
      data: typeof data === "string" ? data : "",
      previousHash:
        isFirstBlock && previousHash === "0".repeat(64) ? "" : previousHash,
      currentHash,
      // Coinbase fields are not part of this antd form directly, displayed separately
    });
  }, [blockNumber, nonce, data, previousHash, currentHash, form, isFirstBlock]);

  const cardStyle: React.CSSProperties = {
    marginBottom: "20px",
    borderColor: isValid ? token.colorSuccessBorder : token.colorErrorBorder,
    borderWidth: "1px", // Changed
    boxShadow: "var(--box-shadow-standard)", // Added
    borderRadius: "var(--border-radius)", // Added
  };

  // cardBodyStyle is removed

  const renderCoinbaseSection = () => {
    if (!coinbase) return null;
    return (
      <>
        <Form.Item>
          <Tooltip
            title={t(
              "MineButtonTooltip",
              "Click to find a new nonce that makes this block's hash valid (starts with '0000')."
            )}
          >
            <Button
              type="primary"
              onClick={onMine}
              loading={isMining}
              block
              data-testid="mine-button-in-modal"
            >
              {t("Mine", "Mine")}
            </Button>
          </Tooltip>
        </Form.Item>
        <Divider dashed />
      </>
    );
  };

  const renderDataSection = () => {
    if (dataType === "transactions" && Array.isArray(data)) {
      return (
        <Form.Item
          label={
            <GlossaryTerm termKey="transaction">
              {t("P2PTransactions", "P2P Transactions")}
            </GlossaryTerm>
          }
        >
          {data.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("NoTransactionsInBlock")}
            />
          ) : (
            data.map((tx, index) => (
              <Card
                key={tx.id || index}
                size="small"
                style={{ marginTop: index > 0 ? "10px" : "0" }}
                type="inner"
              >
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{ wordBreak: "break-all" }}
                >
                  {tx.id && (
                    <Descriptions.Item label={t("TransactionID", "ID")}>
                      <CopyableText
                        textToCopy={String(tx.id)}
                        displayText={`${String(tx.id).substring(0, 6)}...${String(tx.id).substring(String(tx.id).length - 4)}`}
                      />
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label={t("From", "From")}>
                    <CopyableText
                      textToCopy={String(tx.from)}
                      displayText={String(tx.from)}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label={t("To", "To")}>
                    <CopyableText
                      textToCopy={String(tx.to)}
                      displayText={String(tx.to)}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label={t("Value", "Value")}>
                    {tx.value.toString()}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ))
          )}
        </Form.Item>
      );
    }
    return (
      <Form.Item label={t("Data")} name="data">
        <Input.TextArea
          rows={4}
          onChange={onDataChange}
          disabled={dataType === "transactions"}
        />
      </Form.Item>
    );
  };

  return (
    <Card
      title={
        <span style={{ display: "flex", alignItems: "center" }}>
          {`${t("Block")} #${blockNumber}`}
          {isValid ? (
            <CheckCircleTwoTone
              twoToneColor={token.colorSuccess}
              style={{ fontSize: "16px", marginLeft: "8px" }}
            />
          ) : (
            <CloseCircleTwoTone
              twoToneColor={token.colorError}
              style={{ fontSize: "16px", marginLeft: "8px" }}
            />
          )}
        </span>
      }
      style={cardStyle}
      // styles={{ body: cardBodyStyle }} prop removed
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={
            <>
              <GlossaryTerm termKey="block" /> #
            </>
          }
          name="blockNumber"
        >
          <InputNumber readOnly style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label={<GlossaryTerm termKey="nonce" />} name="nonce">
          <InputNumber
            value={nonce}
            onChange={onNonceChange}
            style={{ width: "100%" }}
            min={0}
          />
        </Form.Item>
        {isMining && miningAttemptNonce !== undefined && (
          <div
            style={{
              marginBottom: "16px",
              padding: "8px",
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadiusLG,
              background: token.colorBgContainerDisabled,
            }}
          >
            <Typography.Text style={{ display: "block" }}>
              {t("TryingNonce", "Trying Nonce")}: {miningAttemptNonce}
            </Typography.Text>
            <Typography.Text
              style={{ display: "block", wordBreak: "break-all" }}
            >
              {t("CurrentHashAttempt", "Current Hash Attempt")}:{" "}
              {miningAttemptHash || "..."}
            </Typography.Text>
          </div>
        )}
        {renderCoinbaseSection()}
        {renderDataSection()}
        <Form.Item
          label={<GlossaryTerm termKey="previous_hash" />}
          name="previousHash"
        >
          {isFirstBlock && previousHash === "0".repeat(64) ? (
            <Input
              readOnly
              disabled
              value="0000000000000000000000000000000000000000000000000000000000000000 (Genesis Block)"
            />
          ) : (
            <CopyableText
              textToCopy={previousHash}
              displayText={previousHash}
            />
          )}
        </Form.Item>
        <Form.Item label={<GlossaryTerm termKey="hash" />} name="currentHash">
          <CopyableText textToCopy={currentHash} displayText={currentHash} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={onMine}
            loading={isMining}
            block
            tooltip={{
              title: t(
                "MineButtonTooltip",
                "Click to find a new nonce that makes this block's hash valid (starts with '0000')."
              ),
            }}
            data-testid="mine-button-in-modal" // Added for tutorial targeting
          >
            {t("Mine", "Mine")}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BlockCard;
