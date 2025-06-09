import { useState, useEffect, useCallback } from 'react';
import { BlockType } from '@/lib/blockchainUtils'; // Adjust path as needed

export interface UseBlockSelectionModalReturn {
  isModalVisible: boolean;
  selectedBlockForModal: BlockType | null;
  showModal: (block: BlockType) => void;
  closeModal: () => void;
}

const useBlockSelectionModal = (masterChain: BlockType[]): UseBlockSelectionModalReturn => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  // This state holds the initially selected block, or the latest version if found in masterChain
  const [currentSelectedBlock, setCurrentSelectedBlock] = useState<BlockType | null>(null);

  const showModal = useCallback((block: BlockType) => {
    setCurrentSelectedBlock(block);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setCurrentSelectedBlock(null); // Clear selection on close
  }, []);

  // Effect to keep currentSelectedBlock in sync with masterChain
  useEffect(() => {
    if (currentSelectedBlock && masterChain && masterChain.length > 0) {
      const freshBlockVersion = masterChain.find(b => b.id === currentSelectedBlock.id);
      if (freshBlockVersion) {
        // Only update if there's a meaningful change to avoid infinite loops if objects are always new
        if (JSON.stringify(freshBlockVersion) !== JSON.stringify(currentSelectedBlock)) {
          setCurrentSelectedBlock(freshBlockVersion);
        }
      } else {
        // Block was removed from masterChain, so close modal and clear selection
        closeModal();
      }
    } else if (currentSelectedBlock && masterChain.length === 0) {
        // Chain was reset, close modal
        closeModal();
    }
  }, [masterChain, currentSelectedBlock, closeModal]); // currentSelectedBlock is needed for stringify comparison. ID is not enough if content changes.

  return {
    isModalVisible,
    selectedBlockForModal: currentSelectedBlock, // This is the block data modal should use
    showModal,
    closeModal,
  };
};

export default useBlockSelectionModal;
