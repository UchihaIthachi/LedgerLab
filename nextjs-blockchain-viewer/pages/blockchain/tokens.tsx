import React, { useState, useEffect, useCallback } from "react";
import { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import {
  Row,
  Col,
  Typography,
  Space,
  Input,
  Button as AntButton,
  Card,
} from "antd"; // Added Input, AntButton for tx editing
import BlockCard from "@/components/Blockchain/BlockCard";
import {
  BlockType,
  TransactionType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from "@/lib/blockchainUtils";

const { Title, Text } = Typography;
const { Title, Text } = Typography;

const initialChainLength = 3; // Keep it shorter for this view
const peerIds = ["Peer A", "Peer B", "Peer C"];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

// Sample initial transactions for the first block of each peer
const getInitialTransactions = (
  blockNum: number,
  peerInitial: string
): TransactionType[] => [
  {
    id: `tx-${peerInitial}-${blockNum}-1`,
    from: "Alice",
    to: "Bob",
    value: `${10 * blockNum}${peerInitial}`,
  },
  {
    id: `tx-${peerInitial}-${blockNum}-2`,
    from: "Bob",
    to: "Charlie",
    value: `${5 * blockNum}${peerInitial}`,
  },
];

const TokensPage: NextPage = () => {
  const { t } = useTranslation("common");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  // State to manage input fields for transactions, if direct editing in page is preferred
  const [editingTxState, setEditingTxState] = useState<{
    [txId: string]: Partial<TransactionType>;
  }>({});

  useEffect(() => {
    const newPeers: Peer[] = peerIds.map((id, peerIndex) => {
      const peerInitial = String.fromCharCode(65 + peerIndex); // A, B, C
      const newChain: BlockType[] = [];
      let previousHash = "0".repeat(64);

      // For tokens, initial nonces will likely be different due to different data (transactions)
      // We will let createInitialBlock attempt to mine them or use 0.
      // const precalculatedNonces = [2075, 383, 160]; // Example if data was fixed & simple

      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const transactions = getInitialTransactions(blockNumber, peerInitial);
        const block = createInitialBlock(
          blockNumber,
          transactions,
          previousHash
          // nonce for block with transactions will be different, let createInitialBlock find it or default
        );
        newChain.push(block);
        previousHash = block.currentHash;
      }
      return { peerId: id, chain: newChain };
    });
    setPeers(newPeers);
  }, []);

  const getUpdatedChain = (
    chain: BlockType[],
    startIndex: number
  ): BlockType[] => {
    const updatedChain = [...chain];
    for (let i = startIndex; i < updatedChain.length; i++) {
      if (i > 0) {
        updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data, // data is TransactionType[]
        updatedChain[i].previousHash
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return updatedChain;
  };

  const handleNonceChange = (
    peerId: string,
    blockId: string,
    newNonceValue: string | number | null | undefined
  ) => {
    const newNonce = Number(newNonceValue ?? 0);
    setPeers((currentPeers) =>
      currentPeers.map((peer) => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex((b) => b.id === blockId);
          if (blockIndex === -1) return peer;
          const newChain = [...peer.chain];
          newChain[blockIndex] = { ...newChain[blockIndex], nonce: newNonce };
          return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
        }
        return peer;
      })
    );
  };

  const handleTransactionFieldChange = (
    peerId: string,
    blockId: string,
    txId: string,
    field: keyof Omit<TransactionType, "id" | "timestamp">, // Allow editing 'from', 'to', 'value'
    newValue: string
  ) => {
    setPeers((currentPeers) =>
      currentPeers.map((peer) => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex((b) => b.id === blockId);
          if (blockIndex === -1) return peer;

          const newChain = [...peer.chain];
          const blockToUpdate = { ...newChain[blockIndex] };

          if (Array.isArray(blockToUpdate.data)) {
            const txIndex = blockToUpdate.data.findIndex(
              (tx) => tx.id === txId
            );
            if (txIndex === -1) return peer; // Transaction not found

            const updatedTransactions = [...blockToUpdate.data];
            updatedTransactions[txIndex] = {
              ...updatedTransactions[txIndex],
              [field]: newValue,
            };
            blockToUpdate.data = updatedTransactions;
            newChain[blockIndex] = blockToUpdate;
            return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
          }
        }
        return peer;
      })
    );
  };

  const handleMine = useCallback(async (peerId: string, blockId: string) => {
    const miningKey = `${peerId}-${blockId}`;
    setMiningStates((prev) => ({ ...prev, [miningKey]: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    setPeers((currentPeers) =>
      currentPeers.map((peer) => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex((b) => b.id === blockId);
          if (blockIndex === -1) return peer;
          const newChain = [...peer.chain];
          const blockToMine = newChain[blockIndex];
          let foundNonce = 0;
          for (let i = 0; i <= MAX_NONCE; i++) {
            if (
              checkValidity(
                calculateHash(
                  blockToMine.blockNumber,
                  i,
                  blockToMine.data,
                  blockToMine.previousHash
                )
              )
            ) {
              foundNonce = i;
              break;
            }
          }
          newChain[blockIndex] = { ...blockToMine, nonce: foundNonce };
          const finalUpdatedChain = getUpdatedChain(newChain, blockIndex);
          setMiningStates((prev) => ({ ...prev, [miningKey]: false }));
          return { ...peer, chain: finalUpdatedChain };
        }
        return peer;
      })
    );
  }, []);

  // Simplified input change handler for transaction fields shown directly on the page
  // This is an alternative to more complex state management for inputs inside BlockCard
  const handleTxInputChange = (
    txId: string,
    field: keyof TransactionType,
    value: string
  ) => {
    setEditingTxState((prev) => ({
      ...prev,
      [txId]: { ...prev[txId], [field]: value },
    }));
  };

  // Apply changes from editingTxState to the actual chain state
  const applyTxChanges = (peerId: string, blockId: string, txId: string) => {
    const changes = editingTxState[txId];
    if (!changes) return;

    let finalValue = changes.value; // Keep as string if that's what input provides

    setPeers((currentPeers) =>
      currentPeers.map((peer) => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex((b) => b.id === blockId);
          if (blockIndex === -1) return peer;

          const newChain = [...peer.chain];
          const blockToUpdate = { ...newChain[blockIndex] };

          if (Array.isArray(blockToUpdate.data)) {
            const txIndex = blockToUpdate.data.findIndex(
              (tx) => tx.id === txId
            );
            if (txIndex === -1) return peer;

            const updatedTransactions = [...blockToUpdate.data];
            updatedTransactions[txIndex] = {
              ...updatedTransactions[txIndex],
              from: changes.from ?? updatedTransactions[txIndex].from,
              to: changes.to ?? updatedTransactions[txIndex].to,
              value: finalValue ?? updatedTransactions[txIndex].value,
            };
            blockToUpdate.data = updatedTransactions;
            newChain[blockIndex] = blockToUpdate;
            // Clear editing state for this tx after applying
            setEditingTxState((prev) => {
              const newState = { ...prev };
              delete newState[txId];
              return newState;
            });
            return { ...peer, chain: getUpdatedChain(newChain, blockIndex) };
          }
        }
        return peer;
      })
    );
  };

  return (
    <>
      <Head>
        <title>
          {t("Tokens", "Tokens")} - {t("Blockchain Demo")}
        </title>
      </Head>
      <div>
        <h1>{t("TokensViewTitle", "Blockchain - Tokens View")}</h1>
        <Row gutter={[16, 16]}>
          {peers.map((peer) => (
            <Col key={peer.peerId} xs={24} md={12} lg={8}>
              <Title level={4} style={{ textAlign: "center" }}>
                {t(peer.peerId, peer.peerId)}
              </Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                {peer.chain.map((block, index) => (
                  <div key={`${peer.peerId}-${block.id}`}>
                    <BlockCard
                      blockNumber={block.blockNumber}
                      nonce={block.nonce}
                      data={block.data} // Pass TransactionType[]
                      dataType="transactions" // Specify dataType
                      previousHash={block.previousHash}
                      currentHash={block.currentHash}
                      isValid={block.isValid}
                      onNonceChange={(value) =>
                        handleNonceChange(peer.peerId, block.id, value)
                      }
                      onMine={() => handleMine(peer.peerId, block.id)}
                      isMining={
                        miningStates[`${peer.peerId}-${block.id}`] || false
                      }
                      isFirstBlock={index === 0}
                      // onTransactionFieldChange is not used directly by BlockCard's internal inputs for now
                    />
                    {/* Example of rendering editable transaction inputs below the card */}
                    {Array.isArray(block.data) &&
                      block.data.map((tx) => (
                        <Card
                          size="small"
                          key={`${tx.id}-edit`}
                          style={{
                            marginTop: "5px",
                            backgroundColor: "#fafafa",
                          }}
                        >
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <Text strong>
                              {t("EditTransaction", "Edit Tx")}:{" "}
                              {tx.id.substring(0, 8)}...
                            </Text>
                            <Input
                              addonBefore={t("From")}
                              value={editingTxState[tx.id]?.from ?? tx.from}
                              onChange={(e) =>
                                handleTxInputChange(
                                  tx.id,
                                  "from",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              addonBefore={t("To")}
                              value={editingTxState[tx.id]?.to ?? tx.to}
                              onChange={(e) =>
                                handleTxInputChange(tx.id, "to", e.target.value)
                              }
                            />
                            <Input
                              addonBefore={t("Value")}
                              value={
                                editingTxState[tx.id]?.value?.toString() ??
                                tx.value.toString()
                              }
                              onChange={(e) =>
                                handleTxInputChange(
                                  tx.id,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                            <AntButton
                              onClick={() =>
                                applyTxChanges(peer.peerId, block.id, tx.id)
                              }
                              type="dashed"
                              size="small"
                            >
                              {t("ApplyTxChanges", "Apply Changes to Tx")}
                            </AntButton>
                          </Space>
                        </Card>
                      ))}
                  </div>
                ))}
              </Space>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});

export default TokensPage;
