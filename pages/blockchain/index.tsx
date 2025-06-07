import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { NextPage } from 'next';
import { useRouter } from 'next/router'; // Added useRouter
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Modal, Button, Space } from 'antd'; // Removed FloatButton, Added Space
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'; // Added QuestionCircleOutlined
import BlockCard from '@/components/Blockchain/BlockCard';
import TutorialDisplay from '@/components/Tutorial/TutorialDisplay'; // Import TutorialDisplay
import { TutorialStep } from '@/types/tutorial'; // Import TutorialStep
// import CompactBlockCard from '@/components/Blockchain/CompactBlockCard'; // Comment out CompactBlockCard
// import { ArcherContainer, ArcherElement } from 'react-archer'; // Added react-archer imports
import WhiteboardWrapper from '@/components/Blockchain/WhiteboardCanvas'; // Add this
import {
  BlockType,
  calculateHash,
  checkValidity,
  createInitialBlock,
  MAX_NONCE,
} from '@/lib/blockchainUtils';

// Define constants for initial chain setup at a scope accessible by useEffect and handleResetChain
const INITIAL_CHAIN_LENGTH = 5;
const PRECALCULATED_NONCES = [6359, 19780, 10510, 13711, 36781];


const BlockchainIndexPage: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter(); // Initialize useRouter

  // Tutorial State
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [currentTutorialKey, setCurrentTutorialKey] = useState<string | null>(null);
  const [allTutorialData, setAllTutorialData] = useState<any | null>(null); // Using any for raw JSON

  const [chain, setChain] = useState<BlockType[]>([]);
  const [miningStates, setMiningStates] = useState<{[key: string]: boolean}>({});

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);

  useEffect(() => {
    // Fetch Tutorial Data
    fetch('/data/tutorials/blockchain_tutorial_en.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setAllTutorialData(data);
      })
      .catch((error) => {
        console.error("Could not fetch tutorial data:", error);
      });

    // Initial chain setup
    const newChain: BlockType[] = [];
    let previousHash = '0'.repeat(64);
    // Using PRECALCULATED_NONCES from the broader scope

    for (let i = 0; i < INITIAL_CHAIN_LENGTH; i++) {
      const blockNumber = i + 1;
      const data = `Block ${blockNumber} Data`;
      let currentPreviousHash = previousHash;
      if (i === 1) { // For the second block, make its previousHash invalid
        currentPreviousHash = "invalidhash1234567890abcdefinvalidhash1234567890abcdef";
      }
      const block = createInitialBlock(
        blockNumber,
        data,
        currentPreviousHash, // Use potentially modified previousHash
        // Use PRECALCULATED_NONCES, ensuring it matches length of INITIAL_CHAIN_LENGTH
        (data === `Block ${blockNumber} Data` && PRECALCULATED_NONCES[i] !== undefined) ? PRECALCULATED_NONCES[i] : undefined
      );
      newChain.push(block);
      previousHash = block.currentHash; // Correctly set for the *next* block's previousHash
    }
    setChain(newChain);
  }, []);

  const updateChainCascading = (updatedChain: BlockType[], startIndex: number): BlockType[] => {
    for (let i = startIndex; i < updatedChain.length; i++) {
      if (i > 0) {
        updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
      } else {
        updatedChain[i].previousHash = '0'.repeat(64);
      }
      updatedChain[i].currentHash = calculateHash(
        updatedChain[i].blockNumber,
        updatedChain[i].nonce,
        updatedChain[i].data,
        updatedChain[i].previousHash
      );
      updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
    }
    return [...updatedChain];
  };

  const handleDataChange = (blockId: string, newData: string) => {
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;
      const newChain = [...prevChain];
      newChain[blockIndex] = { ...newChain[blockIndex], data: newData };
      const updatedFullChain = updateChainCascading(newChain, blockIndex);
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock(updatedFullChain[blockIndex]);
      }
      return updatedFullChain;
    });
  };

  const handleResetChain = () => {
    Modal.confirm({
      title: t('ConfirmResetChainTitle', 'Are you sure you want to reset the chain?'),
      content: t('ConfirmResetChainContent', 'This will restore the blockchain to its initial state. All current changes will be lost.'),
      okText: t('Reset', 'Reset'),
      okType: 'danger',
      cancelText: t('Cancel', 'Cancel'),
      onOk: () => {
        const newInitialChain: BlockType[] = [];
        let previousHash = '0'.repeat(64);

        for (let i = 0; i < INITIAL_CHAIN_LENGTH; i++) {
          const blockNumber = i + 1;
          const data = `Block ${blockNumber} Data`;
          const block = createInitialBlock(
            blockNumber,
            data,
            previousHash,
            PRECALCULATED_NONCES[i]
          );
          newInitialChain.push(block);
          previousHash = block.currentHash;
        }
        setChain(newInitialChain);
        // Note: The deliberate invalid link for testing (if (i === 1)...) is NOT reapplied on reset,
        // so the reset chain will be valid. This is generally desired for a reset function.
      },
    });
  };

  const handleRemoveBlock = (blockIdToRemove: string) => {
    Modal.confirm({
      title: t('ConfirmRemoveBlockTitle', 'Are you sure you want to remove this block?'),
      content: t('ConfirmRemoveBlockContent', 'This action cannot be undone. The chain will be revalidated.'),
      okText: t('Remove', 'Remove'),
      okType: 'danger',
      cancelText: t('Cancel', 'Cancel'),
      onOk: () => {
        setChain((prevChain) => {
          const originalIndex = prevChain.findIndex(b => b.id === blockIdToRemove);
          if (originalIndex === -1) return prevChain; // Should not happen if UI is correct

          const newChain = prevChain.filter(block => block.id !== blockIdToRemove);

          if (newChain.length === 0) return [];

          // Determine the starting index for cascading updates
          let startIndex = 0; // Default to 0 for safety, will be adjusted
          if (originalIndex < newChain.length) {
            // If a block was removed from the middle or start,
            // the block that took its place (or the new first block) is the starting point.
            startIndex = originalIndex;
          } else if (newChain.length > 0) {
            // If the last block was removed, no specific relinking is needed for subsequent blocks,
            // but we might still want to ensure the new last block's validity is checked if its properties changed.
            // However, updateChainCascading from 0 or a valid index will handle this.
            // A simpler approach: if last block removed, no specific start index for relinking needed.
            // updateChainCascading will just re-validate. Let's make sure it handles this.
            // If originalIndex was last, newChain.length = originalIndex. Start from new last block if exists.
            startIndex = newChain.length -1;
            if (startIndex < 0) startIndex = 0; // If only one block left, or list becomes empty (handled above)
          }

          // Special handling if the first block (original index 0) was removed
          if (originalIndex === 0 && newChain.length > 0) {
            newChain[0].previousHash = "0".repeat(64); // The new first block becomes genesis
            // Block number might also need adjustment if we want strict sequential numbering starting from 1
            // For now, block numbers will retain their original values, which might lead to gaps.
            // This could be a future enhancement to re-number blocks.
          }

          return updateChainCascading(newChain, startIndex);
        });
      },
    });
  };

  const handleNonceChange = (blockId: string, newNonceValue: string | number | null | undefined) => {
    const newNonce = Number(newNonceValue ?? 0);
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;
      const newChain = [...prevChain];
      newChain[blockIndex] = { ...newChain[blockIndex], nonce: newNonce };
      const updatedFullChain = updateChainCascading(newChain, blockIndex);
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock(updatedFullChain[blockIndex]);
      }
      return updatedFullChain;
    });
  };

  const handleMine = useCallback(async (blockId: string) => {
    setMiningStates(prev => ({...prev, [blockId]: true}));
    await new Promise(resolve => setTimeout(resolve, 0));
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) {
        setMiningStates(prev => ({...prev, [blockId]: false}));
        return prevChain;
      }
      const newChain = [...prevChain];
      const blockToMine = newChain[blockIndex];
      let foundNonce = blockToMine.nonce;
      for (let i = 0; i <= MAX_NONCE; i++) {
        const hash = calculateHash(blockToMine.blockNumber, i, blockToMine.data, blockToMine.previousHash);
        if (checkValidity(hash)) {
          foundNonce = i;
          break;
        }
      }
      newChain[blockIndex] = {...blockToMine, nonce: foundNonce};
      const finalChain = updateChainCascading(newChain, blockIndex);
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock(finalChain[blockIndex]);
      }
      setMiningStates(prev => ({...prev, [blockId]: false}));
      return finalChain;
    });
  }, [selectedBlock]);

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

  // Find the currently mining block's ID (simplified)
  const currentMiningBlockId = useMemo(() => {
    return Object.entries(miningStates).find(([_id, isMining]) => isMining)?.[0] || null;
  }, [miningStates]);

  const handleAddBlock = () => {
    setChain((prevChain) => {
      if (prevChain.length === 0) {
        // If chain is empty, create a genesis block
        // createInitialBlock automatically mines if no nonce is provided.
        const newBlock = createInitialBlock(1, 'Genesis Block', '0'.repeat(64));
        return [newBlock];
      }
      const lastBlock = prevChain[prevChain.length - 1];
      const newBlockNumber = lastBlock.blockNumber + 1;
      // createInitialBlock will mine if no nonce is provided.
      // This new block will be valid and correctly linked.
      const newBlock = createInitialBlock(
        newBlockNumber,
        `Block ${newBlockNumber} Data`,
        lastBlock.currentHash // Link to the actual current hash of the last block
      );
      return [...prevChain, newBlock];
    });
  };

  const handleExecuteTutorialAction = (actionType: string, actionParams?: any) => {
    console.log('Executing tutorial action:', actionType, actionParams); // For debugging

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

  return (
    <>
      <Head>
        <title>{String(t('Blockchain', 'Blockchain'))} - {String(t('Blockchain Demo'))}</title>
      </Head>
      <div>
        <Space align="center" style={{ marginBottom: '16px' }}>
          <h1>{t('BlockchainViewTitle', 'Blockchain - Chain View')}</h1>
          <Button icon={<QuestionCircleOutlined />} onClick={() => startTutorial('blockchainTutorial')}>
            {t('StartTutorialButton', 'Start Tutorial')}
          </Button>
        </Space>
        <WhiteboardWrapper
          chain={chain}
          onNodeClick={showModal}
          miningBlockId={currentMiningBlockId}
          onNodeRemove={handleRemoveBlock}
          onAddBlock={handleAddBlock}
          onResetChain={handleResetChain}
        />

        {isTutorialVisible && tutorialSteps.length > 0 && (
          <TutorialDisplay
            tutorialKey={currentTutorialKey || "blockchainTutorial"}
            steps={tutorialSteps}
            isVisible={isTutorialVisible}
            onClose={() => setIsTutorialVisible(false)}
            onExecuteAction={handleExecuteTutorialAction}
          />
        )}

        {/* Remove or comment out:
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          tooltip={t('AddBlockTooltip', 'Add a new block to the end of the chain')}
          onClick={handleAddBlock}
          style={{ right: 24, bottom: 100 }}
        /> */}

        {/* Remove or comment out the old ArcherElement mapping:
        {chain.map((block, index) => (
          <ArcherElement
            key={block.id}
            id={`block-${block.id}`}
            relations={index < chain.length - 1 ? [{ ... }] : undefined}
          >
            <div style={{ marginRight: '30px', marginLeft: '10px', flexShrink: 0 }}>
              <CompactBlockCard
                blockNumber={block.blockNumber}
                currentHash={block.currentHash}
                previousHash={block.previousHash}
                isValid={block.isValid}
                onClick={() => showModal(block)}
              />
            </div>
          </ArcherElement>
        ))}
        */}
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
