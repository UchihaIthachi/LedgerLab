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
    addBlock, // Renamed to handleAddBlockFromHook below
    resetChain, // Renamed to handleResetChainWithModal below
    updateBlockData, // Renamed to handleDataChangeInModal below
    updateBlockNonce, // Renamed to handleNonceChangeInModal below
    mineBlock, // Renamed to handleMineInModal below
    removeBlock,
  } = useSimpleChain();

  const {
    isModalVisible,
    selectedBlockForModal,
    showModal,
    closeModal
  } = useBlockSelectionModal(chain); // Use the new hook, pass the chain from useSimpleChain

  // Removed old useState for isModalVisible and selectedBlock

  useEffect(() => {
    const initialConfig = {
      initialLength: INITIAL_CHAIN_LENGTH,
      initialNonces: PRECALCULATED_NONCES,
      makeBlockInvalidAtIndex: 1, // Make the second block (index 1) invalid
      // initialDatas: if needed, generate them here based on INITIAL_CHAIN_LENGTH
    };
    initializeChain(initialConfig);
  }, [initializeChain]);

  // Removed local updateChainCascading function, now internal to useSimpleChain

  const handleDataChangeInModal = (blockId: string, newData: string) => {
    updateBlockData(blockId, newData);
    // No longer need to call setSelectedBlock here, hook's useEffect handles it.
  };

  const handleNonceChangeInModal = (blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    updateBlockNonce(blockId, newNonce);
    // No longer need to call setSelectedBlock here.
  };

  const handleMineInModal = async (blockId: string) => {
    await mineBlock(blockId);
    // No longer need to call setSelectedBlock here.
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
          // makeBlockInvalidAtIndex is not applied on reset in the original logic
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

  // Old showModal, handleOk, handleCancel are removed, replaced by showModal, closeModal from the hook.

  const currentMiningBlockId = useMemo(() => {
    return Object.entries(miningStates).find(([_id, isMining]) => isMining)?.[0] || null;
  }, [miningStates]);

  // handleAddBlock now directly uses the hook's addBlock
  const handleAddBlockFromHook = addBlock;

  // Tutorial Action Logic - This should remain as it's page-specific
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
            showModal(blockToOpen); // Use showModal from useBlockSelectionModal hook
        } else {
            console.warn("Tutorial: Block not found for OPEN_BLOCK_MODAL", actionParams);
        }
        break;
      }
      case 'OPEN_BLOCK_MODAL_AND_FOCUS_DATA': {
        const blockToOpen = chain.find(b => actionParams?.blockNumber && b.blockNumber === actionParams.blockNumber);
        if (blockToOpen) {
            showModal(blockToOpen); // Use showModal from useBlockSelectionModal hook
            setTimeout(() => {
                const dataTextArea = document.querySelector('.ant-modal-body textarea[name="data"]') as HTMLTextAreaElement; // This selector might need update if BlockCard structure changes
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
        if(selectedBlockForModal && blockIdToMine === selectedBlockForModal.id) { // If modal is open for the target block
            const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary[data-testid="mine-button-in-modal"]') as HTMLElement; // Check if testid is still there
            if (mineButton) mineButton.click();
            else console.warn("Tutorial: Mine button not found in modal for current block.");
        } else if (blockIdToMine) {
            const blockToOpenAndMine = chain.find(b => b.id === blockIdToMine);
            if (blockToOpenAndMine) {
                showModal(blockToOpenAndMine); // Use showModal from useBlockSelectionModal hook
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

  // This is the function passed to BlockchainPageLayout
  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    // Tab switching logic, if any, would be handled by BlockchainPageLayout or tutorial steps themselves.
    // This function now directly calls the action logic.
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
      {selectedBlock && (
        <BlockDetailModal
          visible={isModalVisible}
          onClose={handleCancel}
          selectedBlockInfo={{ block: selectedBlock }}
          miningState={miningStates[selectedBlock.id] || false}
          onMine={() => handleMineInModal(selectedBlock.id)}
          onNonceChange={(value) => handleNonceChangeInModal(selectedBlock.id, value)}
          onSimpleDataChange={(newData) => handleDataChangeInModal(selectedBlock.id, newData)}
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
