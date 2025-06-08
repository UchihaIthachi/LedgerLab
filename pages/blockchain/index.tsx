import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { NextPage } from 'next';
import { useRouter } from 'next/router'; // Added useRouter
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
// Head, Tabs, MarkdownRenderer, TutorialDisplay, QuestionCircleOutlined will be removed or handled by Layout
import { Modal, Button, Space, Typography } from 'antd'; // Modal might be removed if BlockDetailModal handles it all
import { PlusOutlined } from '@ant-design/icons'; // Removed QuestionCircleOutlined
// BlockCard import will be removed as BlockDetailModal uses it internally
// import BlockCard from '@/components/Blockchain/BlockCard';
// TutorialStep might still be needed if handleExecuteTutorialAction uses it, but likely not directly
// import { TutorialStep } from '@/types/tutorial';
import WhiteboardWrapper from '@/components/Blockchain/WhiteboardCanvas'; // Add this
import BlockchainPageLayout from '@/components/Layout/BlockchainPageLayout'; // Import the new layout
import BlockDetailModal from '@/components/Blockchain/BlockDetailModal'; // Import the new modal
import useSimpleChain from '@/hooks/useSimpleChain'; // Import the new hook
import {
  BlockType,
  // calculateHash, // Handled by hook
  // checkValidity, // Handled by hook
  // createInitialBlock, // Handled by hook
  // MAX_NONCE, // Handled by hook
} from '@/lib/blockchainUtils'; // Keep BlockType if used in function signatures

// Define constants for initial chain setup - these will be passed to the hook
const INITIAL_CHAIN_LENGTH = 5;
const PRECALCULATED_NONCES = [6359, 19780, 10510, 13711, 36781];


const BlockchainIndexPage: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter(); // Initialize useRouter

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
  } = useSimpleChain();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);

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
    // Update selectedBlock if it's the one being edited
    if (selectedBlock && selectedBlock.id === blockId) {
      const updatedBlock = chain.find(b => b.id === blockId);
      if (updatedBlock) setSelectedBlock(updatedBlock); // This might not reflect immediately due to async nature of hook update
    }
  };

  const handleNonceChangeInModal = (blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    updateBlockNonce(blockId, newNonce);
    if (selectedBlock && selectedBlock.id === blockId) {
      const updatedBlock = chain.find(b => b.id === blockId);
      if (updatedBlock) setSelectedBlock(updatedBlock);
    }
  };

  const handleMineInModal = async (blockId: string) => {
    await mineBlock(blockId);
    if (selectedBlock && selectedBlock.id === blockId) {
      const updatedBlock = chain.find(b => b.id === blockId);
       if (updatedBlock) setSelectedBlock(updatedBlock);
    }
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

  // showModal, handleOk, handleCancel remain the same for controlling modal visibility
  const showModal = (block: BlockType) => {
    setSelectedBlock(block);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedBlock(null);
  };

  const currentMiningBlockId = useMemo(() => {
    return Object.entries(miningStates).find(([_id, isMining]) => isMining)?.[0] || null;
  }, [miningStates]);

  // handleAddBlock now directly uses the hook's addBlock
  const handleAddBlockFromHook = addBlock;

  // Tutorial Action Logic
  const executeActionLogic = (actionType: string, actionParams?: any) => {
    switch (actionType) {
      case 'NAVIGATE_TO_PAGE':
        // For NAVIGATE_TO_PAGE, we don't need to switch tabs first, just navigate.
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
        if (actionParams?.blockNumber && chain.length >= actionParams.blockNumber) {
            const blockToOpen = chain[actionParams.blockNumber - 1];
            if (blockToOpen) {
                showModal(blockToOpen);
            }
        } else if (actionParams?.selector) {
            const nodeElement = document.querySelector(actionParams.selector);
            if (nodeElement) {
                const blockId = nodeElement.getAttribute('data-block-id');
                const blockToOpen = chain.find(b => b.id === blockId);
                if (blockToOpen) showModal(blockToOpen);
                else console.warn("Tutorial: Block not found for node selector " + actionParams.selector);
            } else {
                 console.warn("Tutorial: Node element not found for selector " + actionParams.selector);
            }
        }
        break;
      }

      case 'OPEN_BLOCK_MODAL_AND_FOCUS_DATA':
        if (actionParams?.blockNumber && chain.length >= actionParams.blockNumber) {
            const blockToOpen = chain[actionParams.blockNumber - 1];
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
        }
        break;

      case 'CLICK_MINE_BUTTON':
        if (selectedBlock) {
            const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary') as HTMLElement;
            if (mineButton && mineButton.innerText.toLowerCase().includes('mine')) {
                mineButton.click();
            } else {
                 console.warn("Tutorial: Mine button not found in modal for current block.");
            }
        } else if (actionParams?.blockNumber) {
            const blockToMine = chain[actionParams.blockNumber - 1];
            if (blockToMine) {
                showModal(blockToMine);
                setTimeout(() => {
                    const mineButton = document.querySelector('.ant-modal-body button.ant-btn-primary') as HTMLElement;
                    if (mineButton && mineButton.innerText.toLowerCase().includes('mine')) {
                        mineButton.click();
                    } else {
                         console.warn(`Tutorial: Mine button not found in modal for block ${actionParams.blockNumber}.`);
                    }
                }, 100);
            }
        }
        break;

      default:
        console.warn(`Tutorial: Unknown actionType: ${actionType}`);
    }
  };

  const startTutorial = (tutorialKey: string) => {
    if (allTutorialData && allTutorialData[tutorialKey]) {
      const selectedTutorial = allTutorialData[tutorialKey];
      const flattenedSteps: TutorialStep[] = selectedTutorial.sections.reduce(
        (acc: TutorialStep[], section: any) => acc.concat(section.steps),
        []
      );
      // Simple filter for current page or generic steps - might need refinement
      const relevantSteps = flattenedSteps.filter(step => {
        if (!step.pagePath) return true; // Always include if no specific page
        if (Array.isArray(step.pagePath)) return step.pagePath.includes(router.pathname);
        return step.pagePath === router.pathname;
      });

      // If, after filtering, no steps are relevant for the current page,
      // it might be better to show the first step of the tutorial and rely on NAVIGATE_TO_PAGE.
      // For now, this simplified filter is used. A more robust solution might involve
      // loading all steps and letting TutorialDisplay manage current page relevance or navigation.
      // Let's use all steps for now and rely on NAVIGATE_TO_PAGE.
      setTutorialSteps(flattenedSteps);
      setCurrentTutorialKey(tutorialKey);
      setIsTutorialVisible(true);
    } else {
      console.warn(`Tutorial with key "${tutorialKey}" not found or data not loaded yet.`);
    }
  };

  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    console.log('Executing tutorial action:', actionType, actionParams);

    const demoInteractionActions = [
      'HIGHLIGHT_ELEMENT',
      'FOCUS_ELEMENT',
      'OPEN_BLOCK_MODAL',
      'OPEN_BLOCK_MODAL_AND_FOCUS_DATA',
      'CLICK_MINE_BUTTON'
    ];

    if (demoInteractionActions.includes(actionType)) {
      if (activeTabKey !== "1") {
        setActiveTabKey("1");
        setTimeout(() => {
          executeActionLogic(actionType, actionParams);
        }, 100); // Increased delay slightly for tab switch rendering
        return;
      }
    }
    // The main executeActionLogic and its caller handleExecuteTutorialAction should be preserved.
    // The old startTutorial function that sets steps and visibility is removed.
    executeActionLogic(actionType, actionParams);
  };

  // The actual activeTabKey state is now managed by BlockchainPageLayout.
  // If handleExecuteTutorialAction needs to switch tabs, it might need a different approach
  // or the layout could expose a function to do so, or this logic is simplified.
  // For now, assuming the layout handles tab display and this page only provides content.
  // The original logic for handleExecuteTutorialAction switching tabs if not on "1" for demo actions
  // will be temporarily broken or needs rethinking if layout doesn't expose tab control.
  // However, the tutorial steps themselves should ideally handle navigation if a specific tab is required.

  return (
    <BlockchainPageLayout
      pageTitle={t('BlockchainPageTitle', 'Blockchain Demonstration')}
      theoryDocPath="/docs/blockchain.md"
      tutorialKey="blockchainTutorial"
      onExecuteTutorialAction={handleExecuteTutorialAction} // Pass the existing handler
    >
      <WhiteboardWrapper
        chain={chain}
        onNodeClick={showModal}
        miningBlockId={currentMiningBlockId}
        onNodeRemove={handleRemoveBlock}
        onAddBlock={handleAddBlock}
        onResetChain={handleResetChain}
      />
      {selectedBlock && (
        <Modal
          title={`${t('BlockDetailsTitle', 'Block Details')} - ${t('Block', 'Block')} #${selectedBlock.blockNumber}`}
            visible={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            width={800}
            footer={[ <Button key="close" onClick={handleOk}> {t('CloseButton', 'Close')} </Button> ]}
          >
            <BlockCard
              blockNumber={selectedBlock.blockNumber}
              nonce={selectedBlock.nonce}
              data={selectedBlock.data}
              previousHash={selectedBlock.previousHash}
              currentHash={selectedBlock.currentHash}
              isValid={selectedBlock.isValid}
              onDataChange={(e) => handleDataChange(selectedBlock.id, e.target.value)}
              onNonceChange={(value) => handleNonceChange(selectedBlock.id, value)}
              onMine={() => handleMine(selectedBlock.id)}
              isMining={miningStates[selectedBlock.id] || false}
              isFirstBlock={selectedBlock.blockNumber === 1}
            />
          </Modal>
        )}
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default BlockchainIndexPage;
