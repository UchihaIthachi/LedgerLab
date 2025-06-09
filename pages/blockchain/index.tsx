import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Modal, Button, Typography } from 'antd'; // Modal for confirm, Button for Modal footer.
// PlusOutlined might be removable if not used by other components on this page.
import { PlusOutlined } from '@ant-design/icons';
import WhiteboardWrapper from '@/components/Blockchain/WhiteboardCanvas';
import BlockchainPageLayout from '@/components/Layout/BlockchainPageLayout';
import BlockDetailModal from '@/components/Blockchain/BlockDetailModal';
import useSimpleChain from '@/hooks/useSimpleChain';
import useBlockSelectionModal from '@/hooks/useBlockSelectionModal'; // Import the new hook
import { BlockType } from '@/lib/blockchainUtils';

// Define constants for initial chain setup - these will be passed to the hook
const INITIAL_CHAIN_LENGTH = 5;
const PRECALCULATED_NONCES = [6359, 19780, 10510, 13711, 36781];

const BlockchainIndexPage: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const {
    chain,
    miningStates,
    initializeChain,
    addBlock,
    resetChain,
    updateBlockData,
    updateBlockNonce,
    mineBlock,
    removeBlock,
    miningAttempts, // Destructure miningAttempts
  } = useSimpleChain();

  const {
    isModalVisible,
    selectedBlockForModal,
    showModal,
    closeModal
  } = useBlockSelectionModal(chain);

  useEffect(() => {
    const initialConfig = {
      initialLength: INITIAL_CHAIN_LENGTH,
      initialNonces: PRECALCULATED_NONCES,
      makeBlockInvalidAtIndex: 1,
    };
    initializeChain(initialConfig);
  }, [initializeChain]);

  const handleDataChangeInModal = (blockId: string, newData: string) => {
    updateBlockData(blockId, newData);
  };

  const handleNonceChangeInModal = (blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    updateBlockNonce(blockId, newNonce);
  };

  const handleMineInModal = async (blockId: string) => {
    await mineBlock(blockId);
  };

  const handleResetChainWithModal = () => {
    Modal.confirm({
      title: t('ConfirmResetChainTitle', 'Are you sure you want to reset the chain?'),
      content: t('ConfirmResetChainContent', 'This will restore the blockchain to its initial state. All current changes will be lost.'),
      okText: t('Reset', 'Reset'),
      okType: 'danger',
      cancelText: t('Cancel', 'Cancel'),
      onOk: () => {
        const initialConfig = {
          initialLength: INITIAL_CHAIN_LENGTH,
          initialNonces: PRECALCULATED_NONCES,
        };
        resetChain(initialConfig);
      },
    });
  };

  const handleRemoveBlockWithModal = (blockIdToRemove: string) => {
    Modal.confirm({
      title: t('ConfirmRemoveBlockTitle', 'Are you sure you want to remove this block?'),
      content: t('ConfirmRemoveBlockContent', 'This action cannot be undone. The chain will be revalidated.'),
      okText: t('Remove', 'Remove'),
      okType: 'danger',
      cancelText: t('Cancel', 'Cancel'),
      onOk: () => {
        removeBlock(blockIdToRemove);
      },
    });
  };

  const currentMiningBlockId = useMemo(() => {
    return Object.entries(miningStates).find(([_id, isMining]) => isMining)?.[0] || null;
  }, [miningStates]);

  const handleAddBlockFromHook = addBlock;

  const executeActionLogic = (actionType: string, actionParams?: any) => {
    switch (actionType) {
      case 'NAVIGATE_TO_PAGE':
        if (actionParams?.path) {
          router.push(actionParams.path);
        }
        break;
      case 'HIGHLIGHT_ELEMENT':
        if (actionParams?.selector) {
          const element = document.querySelector(actionParams.selector);
          if (element) {
            element.classList.add('tutorial-highlight');
            setTimeout(() => {
              element.classList.remove('tutorial-highlight');
            }, 2000);
          } else {
            console.warn(`Tutorial: Element not found for selector: ${actionParams.selector}`);
          }
        }
        break;
      case 'FOCUS_ELEMENT':
        if (actionParams?.selector) {
          const element = document.querySelector(actionParams.selector) as HTMLElement;
          if (element && typeof element.focus === 'function') {
            element.focus();
          } else {
            console.warn(`Tutorial: Element not focusable or not found: ${actionParams.selector}`);
          }
        }
        break;
      case 'OPEN_BLOCK_MODAL': {
        const blockIdToOpen = actionParams?.blockId || (actionParams?.blockNumber && chain[actionParams.blockNumber -1])?.id;
        const blockToOpen = chain.find(b =>
            (actionParams?.blockNumber && b.blockNumber === actionParams.blockNumber) ||
            (actionParams?.selector && b.id === (document.querySelector(actionParams.selector)?.getAttribute('data-block-id'))) ||
            (blockIdToOpen && b.id === blockIdToOpen)
        );
        if (blockToOpen) {
            showModal(blockToOpen);
        } else {
            console.warn("Tutorial: Block not found for OPEN_BLOCK_MODAL", actionParams);
        }
        break;
      }
      case 'OPEN_BLOCK_MODAL_AND_FOCUS_DATA': {
        const blockToOpen = chain.find(b => actionParams?.blockNumber && b.blockNumber === actionParams.blockNumber);
        if (blockToOpen) {
            showModal(blockToOpen);
            setTimeout(() => {
                const dataTextArea = document.querySelector('.ant-modal-body textarea[name="data"]') as HTMLTextAreaElement;
                if (dataTextArea && typeof dataTextArea.focus === 'function') {
                    dataTextArea.focus();
                    dataTextArea.select();
                } else {
                    console.warn("Tutorial: Data textarea not found in modal.");
                }
            }, 100);
        }
        break;
      }
      case 'CLICK_MINE_BUTTON': {
        const blockIdToMine = selectedBlockForModal?.id || (actionParams?.blockNumber && chain[actionParams.blockNumber-1])?.id;
        if(selectedBlockForModal && blockIdToMine === selectedBlockForModal.id) {
            const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary[data-testid="mine-button-in-modal"]') as HTMLElement;
            if (mineButton) mineButton.click();
            else console.warn("Tutorial: Mine button not found in modal for current block.");
        } else if (blockIdToMine) {
            const blockToOpenAndMine = chain.find(b => b.id === blockIdToMine);
            if (blockToOpenAndMine) {
                showModal(blockToOpenAndMine);
                setTimeout(() => {
                    const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary[data-testid="mine-button-in-modal"]') as HTMLElement;
                    if (mineButton) mineButton.click();
                    else  console.warn(`Tutorial: Mine button not found in modal for block ${blockIdToMine}.`);
                }, 100);
            } else {
                 console.warn(`Tutorial: Block not found to open and mine: ${blockIdToMine}`);
            }
        }
        break;
      }
      default:
        console.warn(`Tutorial: Unknown actionType: ${actionType}`);
    }
  };

  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    executeActionLogic(actionType, actionParams);
  };

  return (
    <BlockchainPageLayout
      pageTitle={t('BlockchainPageTitle', 'Blockchain Demonstration')}
      theoryDocPath="/docs/blockchain.md"
      tutorialKey="blockchainTutorial"
      onExecuteTutorialAction={handleExecuteTutorialAction}
    >
      <WhiteboardWrapper
        chain={chain}
        onNodeClick={showModal}
        miningBlockId={currentMiningBlockId}
        onNodeRemove={handleRemoveBlockWithModal}
        onAddBlock={handleAddBlockFromHook}
        onResetChain={handleResetChainWithModal}
      />
      {selectedBlockForModal && (
        <BlockDetailModal
          visible={isModalVisible}
          onClose={closeModal}
          selectedBlockInfo={selectedBlockForModal ? { block: selectedBlockForModal } : null}
          miningState={selectedBlockForModal ? (miningStates[selectedBlockForModal.id] || false) : false}
          miningAttemptNonce={selectedBlockForModal ? miningAttempts[selectedBlockForModal.id]?.nonce : undefined}
          miningAttemptHash={selectedBlockForModal ? miningAttempts[selectedBlockForModal.id]?.hash : undefined}
          onMine={() => selectedBlockForModal && handleMineInModal(selectedBlockForModal.id)}
          onNonceChange={(value) => selectedBlockForModal && handleNonceChangeInModal(selectedBlockForModal.id, value)}
          onSimpleDataChange={(newData) => selectedBlockForModal && handleDataChangeInModal(selectedBlockForModal.id, newData)}
          blockDataType="simple_text"
        />
      )}
    </BlockchainPageLayout>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default BlockchainIndexPage;
