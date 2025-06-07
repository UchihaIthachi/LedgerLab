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
  Modal, // Added Modal
} from "antd";
import BlockCard from "@/components/Blockchain/BlockCard";
import CompactBlockCard from "@/components/Blockchain/CompactBlockCard"; // Added CompactBlockCard
import {
  BlockType,
  TransactionType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from "@/lib/blockchainUtils";

const { Title, Text } = Typography;

const initialChainLength = 3;
const peerIds = ["Peer A", "Peer B", "Peer C"];

interface Peer {
  peerId: string;
  chain: BlockType[];
}

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
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>({});
  const [editingTxState, setEditingTxState] = useState<{
    [txId: string]: Partial<TransactionType>;
  }>({});

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  useEffect(() => {
    const newPeers: Peer[] = peerIds.map((id, peerIndex) => {
      const peerInitial = String.fromCharCode(65 + peerIndex);
      const newChain: BlockType[] = [];
      let previousHash = "0".repeat(64);
      for (let i = 0; i < initialChainLength; i++) {
        const blockNumber = i + 1;
        const transactions = getInitialTransactions(blockNumber, peerInitial);
        const block = createInitialBlock(blockNumber, transactions, previousHash);
        newChain.push(block);
        previousHash = block.currentHash;
      }
      return { peerId: id, chain: newChain };
    });
    setPeers(newPeers);
  }, []);

  const getUpdatedChain = (chain: BlockType[], startIndex: number): BlockType[] => {
    const updatedChain = [...chain];
    for (let i = startIndex; i < updatedChain.length; i++) {
      if (i > 0) {
        updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
      } else {
        updatedChain[i].previousHash = "0".repeat(64);
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return updatedChain;
  };

  const updatePeerChainAndSelectedBlock = (
    peerId: string,
    blockId: string,
    chainUpdateLogic: (chain: BlockType[]) => BlockType[]
  ) => {
    setPeers((currentPeers) =>
      currentPeers.map((peer) => {
        if (peer.peerId === peerId) {
          const blockIndex = peer.chain.findIndex((b) => b.id === blockId);
          if (blockIndex === -1) return peer;

          const updatedPeerChain = chainUpdateLogic([...peer.chain]);

          if (selectedBlock && selectedBlock.id === blockId && selectedPeerId === peerId) {
            setSelectedBlock(updatedPeerChain.find(b => b.id === blockId) || null);
          }
          return { ...peer, chain: updatedPeerChain };
        }
        return peer;
      })
    );
  };

  const handleNonceChange = (
    peerId: string,
    blockId: string,
    newNonceValue: string | number | null | undefined
  ) => {
    const newNonce = Number(newNonceValue ?? 0);
    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex((b) => b.id === blockId);
      currentChain[blockIndex] = { ...currentChain[blockIndex], nonce: newNonce };
      return getUpdatedChain(currentChain, blockIndex);
    });
  };

  const handleMine = useCallback(async (peerId: string, blockId: string) => {
    const miningKey = `${peerId}-${blockId}`;
    setMiningStates((prev) => ({ ...prev, [miningKey]: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex((b) => b.id === blockId);
      const blockToMine = currentChain[blockIndex];
      let foundNonce = 0;
      for (let i = 0; i <= MAX_NONCE; i++) {
        if (checkValidity(calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash))) {
          foundNonce = i;
          break;
        }
      }
      currentChain[blockIndex] = { ...blockToMine, nonce: foundNonce };
      setMiningStates((prev) => ({ ...prev, [miningKey]: false }));
      return getUpdatedChain(currentChain, blockIndex);
    });
  }, [selectedPeerId, selectedBlock]); // Dependencies for useCallback

  const handleTxInputChange = (
    txId: string,
    field: keyof Omit<TransactionType, "id" | "timestamp">,
    value: string
  ) => {
    setEditingTxState((prev) => ({
      ...prev,
      [txId]: { ...prev[txId], [field]: value },
    }));
  };

  const applyTxChanges = (peerId: string, blockId: string, txId: string) => {
    const changes = editingTxState[txId];
    if (!changes) return;
    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex((b) => b.id === blockId);
      const blockToUpdate = { ...currentChain[blockIndex] };
      if (Array.isArray(blockToUpdate.data)) {
        const txIndex = blockToUpdate.data.findIndex((tx) => tx.id === txId);
        if (txIndex !== -1) {
          const updatedTransactions = [...blockToUpdate.data];
          updatedTransactions[txIndex] = { ...updatedTransactions[txIndex], ...changes };
          blockToUpdate.data = updatedTransactions;
          currentChain[blockIndex] = blockToUpdate;
          setEditingTxState((prev) => { const newState = { ...prev }; delete newState[txId]; return newState; });
        }
      }
      return getUpdatedChain(currentChain, blockIndex);
    });
  };

  const showBlockModal = (peer: Peer, block: BlockType) => {
    setSelectedPeerId(peer.peerId);
    setSelectedBlock(block);
    // Reset editing state when opening a new block, or load existing if any
    // For simplicity, reset here. A more complex state might persist edits.
    setEditingTxState({});
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
    setSelectedPeerId(null);
    setEditingTxState({}); // Clear editing state on modal close
  };

  return (
    <>
      <Head>
        <title>
          {String(t("Tokens", "Tokens"))} - {String(t("Blockchain Demo"))}
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
              <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', padding: '10px 0', WebkitOverflowScrolling: 'touch' }}>
                {peer.chain.map((block) => (
                  <div key={`${peer.peerId}-${block.id}`} style={{ marginRight: '10px', flexShrink: 0 }}>
                    <CompactBlockCard
                      blockNumber={block.blockNumber}
                      currentHash={block.currentHash}
                      previousHash={block.previousHash}
                      isValid={block.isValid}
                      onClick={() => showBlockModal(peer, block)}
                    />
                  </div>
                ))}
              </div>
            </Col>
          ))}
        </Row>

        {selectedBlock && selectedPeerId && (
          <Modal
            title={`${t('TokenBlockDetails', 'Token Block Details')} - ${t('Peer', 'Peer')} ${selectedPeerId} - ${t('Block', 'Block')} #${selectedBlock.blockNumber}`}
            visible={isModalVisible}
            onOk={handleModalClose}
            onCancel={handleModalClose}
            width={800}
            footer={[ <AntButton key="close" onClick={handleModalClose}> {t('CloseButton', 'Close')} </AntButton> ]}
          >
            <BlockCard
              blockNumber={selectedBlock.blockNumber}
              nonce={selectedBlock.nonce}
              data={selectedBlock.data}
              dataType="transactions"
              previousHash={selectedBlock.previousHash}
              currentHash={selectedBlock.currentHash}
              isValid={selectedBlock.isValid}
              onNonceChange={(value) => handleNonceChange(selectedPeerId, selectedBlock.id, value)}
              onMine={() => handleMine(selectedPeerId, selectedBlock.id)}
              isMining={ miningStates[`${selectedPeerId}-${selectedBlock.id}`] || false }
              isFirstBlock={selectedBlock.blockNumber === 1}
            />
            {/* Editable P2P Transactions Section for Modal */}
            {Array.isArray(selectedBlock.data) && selectedBlock.data.length > 0 && (
              <Card size="small" key={`${selectedBlock.id}-p2p-edit-modal`} style={{ marginTop: "5px", backgroundColor: "#f0f0f0" }}>
                <Text strong>{t("EditP2PTxs", "Edit P2P Txs")}</Text>
                {selectedBlock.data.map((tx) => (
                  <Space direction="vertical" key={tx.id} style={{ width: "100%", marginTop: "5px", paddingTop: "5px", borderTop: "1px dashed #ccc" }}>
                    <Input addonBefore={t("From")} value={editingTxState[tx.id]?.from ?? tx.from}
                      onChange={(e) => handleTxInputChange(tx.id, "from", e.target.value)}
                    />
                    <Input addonBefore={t("To")} value={editingTxState[tx.id]?.to ?? tx.to}
                      onChange={(e) => handleTxInputChange(tx.id, "to", e.target.value)}
                    />
                    <Input addonBefore={t("Value")} value={editingTxState[tx.id]?.value?.toString() ?? tx.value.toString()}
                      onChange={(e) => handleTxInputChange(tx.id, "value", e.target.value)}
                    />
                    <AntButton onClick={() => applyTxChanges(selectedPeerId, selectedBlock.id, tx.id)} type="dashed" size="small">
                      {t("ApplyTxChanges", "Apply Changes to Tx")} {tx.id.substring(0, 4)}...
                    </AntButton>
                  </Space>
                ))}
              </Card>
            )}
          </Modal>
        )}
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
