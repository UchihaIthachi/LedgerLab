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
  InputNumber,
  Card,
  Modal,
} from "antd";
import BlockCard from "@/components/Blockchain/BlockCard";
import CompactBlockCard from "@/components/Blockchain/CompactBlockCard";
import { ArcherContainer, ArcherElement } from 'react-archer'; // Added react-archer
import {
  BlockType,
  TransactionType,
  CoinbaseTransactionType,
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

const getInitialCoinbase = (
  blockNum: number,
  peerInitial: string
): CoinbaseTransactionType => ({
  to: `Miner-${peerInitial}`,
  value: 100,
});

const getInitialP2PTransactions = (
  blockNum: number,
  peerInitial: string
): TransactionType[] => {
  if (blockNum === 1) return [];
  return [
    {
      id: `tx-${peerInitial}-${blockNum}-1`,
      from: `Miner-${peerInitial}`,
      to: "Alice",
      value: `${10 * blockNum}`,
    },
    {
      id: `tx-${peerInitial}-${blockNum}-2`,
      from: "Alice",
      to: "Bob",
      value: `${5 * blockNum}`,
    },
  ];
};

const CoinbasePage: NextPage = () => {
  const { t } = useTranslation("common");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [miningStates, setMiningStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [editingTxState, setEditingTxState] = useState<{
    [txId: string]: Partial<TransactionType>;
  }>({});
  const [editingCoinbaseState, setEditingCoinbaseState] = useState<{
    [blockId: string]: Partial<CoinbaseTransactionType>;
  }>({});

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
        const coinbaseTx = getInitialCoinbase(blockNumber, peerInitial);
        const p2pTxs = getInitialP2PTransactions(blockNumber, peerInitial);
        const block = createInitialBlock(
          blockNumber,
          p2pTxs,
          previousHash,
          undefined,
          coinbaseTx
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
      } else {
        updatedChain[i].previousHash = "0".repeat(64);
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash,
        updatedChain[i].coinbase
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

  const handleTxInputChange = (
    txId: string,
    field: keyof TransactionType,
    value: string
  ) => {
    setEditingTxState((prev) => ({ ...prev, [txId]: { ...prev[txId], [field]: value } }));
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

  const handleCoinbaseInputChange = (
    blockId: string,
    field: keyof CoinbaseTransactionType,
    value: string | number
  ) => {
    setEditingCoinbaseState((prev) => ({ ...prev, [blockId]: { ...prev[blockId], [field]: value } }));
  };

  const applyCoinbaseChanges = (peerId: string, blockId: string) => {
    const changes = editingCoinbaseState[blockId];
    if (!changes) return;
    updatePeerChainAndSelectedBlock(peerId, blockId, (currentChain) => {
      const blockIndex = currentChain.findIndex((b) => b.id === blockId);
      currentChain[blockIndex] = {
        ...currentChain[blockIndex],
        coinbase: { ...currentChain[blockIndex].coinbase!, ...changes },
      };
      setEditingCoinbaseState((prev) => { const newState = { ...prev }; delete newState[blockId]; return newState; });
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
            if (checkValidity(calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash, blockToMine.coinbase))) {
                foundNonce = i;
                break;
            }
        }
        currentChain[blockIndex] = { ...blockToMine, nonce: foundNonce };
        setMiningStates((prev) => ({ ...prev, [miningKey]: false }));
        return getUpdatedChain(currentChain, blockIndex);
    });
  }, [selectedPeerId, selectedBlock]);

  const showBlockModal = (peer: Peer, block: BlockType) => {
    setSelectedPeerId(peer.peerId);
    setSelectedBlock(block);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
    setSelectedPeerId(null);
  };

  return (
    <>
      <Head>
        <title>
          {String(t("Coinbase", "Coinbase"))} - {String(t("Blockchain Demo"))}
        </title>
      </Head>
      <div>
        <h1>{t("CoinbaseViewTitle", "Blockchain - Coinbase View")}</h1>
        <Row gutter={[16, 16]}>
          {peers.map((peer) => (
            <Col key={peer.peerId} span={24}>
              <Title level={4} style={{ textAlign: "center" }}>
                {t(peer.peerId, peer.peerId)}
              </Title>
              <ArcherContainer strokeColor="grey" endMarker={false}>
                <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', padding: '10px 0', WebkitOverflowScrolling: 'touch' }}>
                  {peer.chain.map((block, index) => (
                    <ArcherElement
                      key={block.id} // Keep key on ArcherElement if it's the direct child of map
                      id={`peer-${peer.peerId}-block-${block.id}`}
                      relations={index < peer.chain.length - 1 ? [{
                        targetId: `peer-${peer.peerId}-block-${peer.chain[index + 1].id}`,
                        targetAnchor: 'left',
                        sourceAnchor: 'right',
                        style: { strokeWidth: 3 },
                      }] : undefined}
                    >
                      <div style={{ marginRight: '30px', marginLeft: '10px', flexShrink: 0 }}>
                        <CompactBlockCard
                          blockNumber={block.blockNumber}
                          currentHash={block.currentHash}
                          previousHash={block.previousHash}
                          isValid={block.isValid}
                          onClick={() => showBlockModal(peer, block)}
                        />
                      </div>
                    </ArcherElement>
                  ))}
                </div>
              </ArcherContainer>
            </Col>
          ))}
        </Row>

        {selectedBlock && selectedPeerId && (
          <Modal
            title={`${t('CoinbaseBlockDetails', 'Coinbase Block Details')} - ${t('Peer', 'Peer')} ${selectedPeerId} - ${t('Block', 'Block')} #${selectedBlock.blockNumber}`}
            visible={isModalVisible}
            onOk={handleModalClose}
            onCancel={handleModalClose}
            width={800}
            footer={[ <AntButton key="close" onClick={handleModalClose}> {t('CloseButton', 'Close')} </AntButton> ]}
          >
            <BlockCard
              blockNumber={selectedBlock.blockNumber}
              nonce={selectedBlock.nonce}
              coinbase={selectedBlock.coinbase}
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
            {selectedBlock.coinbase && (
              <Card size="small" key={`${selectedBlock.id}-cb-edit-modal`} style={{ marginTop: "5px", backgroundColor: "#fafafa" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>{t("EditCoinbaseTx", "Edit Coinbase Tx")}</Text>
                  <Input addonBefore={t("To")} value={ editingCoinbaseState[selectedBlock.id]?.to ?? selectedBlock.coinbase.to }
                    onChange={(e) => handleCoinbaseInputChange(selectedBlock.id, "to", e.target.value)}
                  />
                  <InputNumber addonBefore={t("ValueMinted", "Value (Minted)")} value={Number(editingCoinbaseState[selectedBlock.id]?.value ?? selectedBlock.coinbase.value)}
                    onChange={(value) => handleCoinbaseInputChange(selectedBlock.id, "value", value ?? 0)} style={{ width: "100%" }}
                  />
                  <AntButton onClick={() => applyCoinbaseChanges(selectedPeerId, selectedBlock.id)} type="dashed" size="small">
                    {t("ApplyCoinbaseChanges", "Apply Coinbase Changes")}
                  </AntButton>
                </Space>
              </Card>
            )}
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

export default CoinbasePage;
