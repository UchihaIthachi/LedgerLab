import { useState, useCallback } from 'react';
import { BlockType, calculateHash, checkValidity, createInitialBlock, MAX_NONCE } from '@/lib/blockchainUtils';

// Helper function for cascading updates
const updateChainCascadingInternal = (updatedChain: BlockType[], startIndex: number): BlockType[] => {
  for (let i = startIndex; i < updatedChain.length; i++) {
    if (i > 0) {
      updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
    } else {
      // Ensure the first block (if it's the start of the cascade) has a genesis previousHash
      if (updatedChain[i].blockNumber === 1) { // This check might be redundant if block numbers are always sequential from 1
         updatedChain[i].previousHash = '0'.repeat(64);
      }
    }
    updatedChain[i].currentHash = calculateHash(
      updatedChain[i].blockNumber,
      updatedChain[i].nonce,
      updatedChain[i].data,
      updatedChain[i].previousHash
    );
    updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
  }
  return [...updatedChain]; // Return a new array to trigger state update
};

export interface UseSimpleChainConfig {
  initialLength?: number;
  initialNonces?: number[];
  initialDatas?: string[];
  makeBlockInvalidAtIndex?: number;
}

export interface UseSimpleChainReturn {
  chain: BlockType[];
  miningStates: { [blockId: string]: boolean };
  miningAttempts: { [blockId: string]: { nonce: number, hash: string } };
  initializeChain: (config?: UseSimpleChainConfig) => void;
  addBlock: () => void;
  resetChain: (config?: UseSimpleChainConfig) => void;
  updateBlockData: (blockId: string, newData: string) => void;
  updateBlockNonce: (blockId: string, newNonce: number) => void;
  mineBlock: (blockId: string) => Promise<void>;
  removeBlock: (blockId: string) => void;
}

const useSimpleChain = (defaultConfig?: UseSimpleChainConfig): UseSimpleChainReturn => {
  const [chain, setChain] = useState<BlockType[]>([]);
  const [miningStates, setMiningStates] = useState<{ [blockId: string]: boolean }>({});
  const [miningAttempts, setMiningAttempts] = useState<{ [blockId: string]: { nonce: number, hash: string } }>({});

  const initializeOrResetChain = useCallback((config?: UseSimpleChainConfig) => {
    const conf = config || defaultConfig || { initialLength: 3 };
    const newChain: BlockType[] = [];
    let previousHash = '0'.repeat(64);

    for (let i = 0; i < (conf.initialLength || 3); i++) {
      const blockNumber = i + 1;
      const data = conf.initialDatas?.[i] || `Block ${blockNumber} Data`;
      let currentPreviousHash = previousHash;

      if (conf.makeBlockInvalidAtIndex === i) {
        currentPreviousHash = "invalidhash_for_testing_".padEnd(64, '0');
      }

      const block = createInitialBlock(
        blockNumber,
        data,
        currentPreviousHash,
        conf.initialNonces?.[i]
      );
      newChain.push(block);
      previousHash = block.currentHash;
    }
    setChain(newChain);
    setMiningStates({});
    setMiningAttempts({});
  }, [defaultConfig]);

  const initializeChain = useCallback((config?: UseSimpleChainConfig) => {
    initializeOrResetChain(config);
  }, [initializeOrResetChain]);

  const resetChain = useCallback((config?: UseSimpleChainConfig) => {
    initializeOrResetChain(config);
  }, [initializeOrResetChain]);

  const addBlock = useCallback(() => {
    setChain((prevChain) => {
      if (prevChain.length === 0) {
        const newBlock = createInitialBlock(1, 'Genesis Block', '0'.repeat(64));
        return [newBlock];
      }
      const lastBlock = prevChain[prevChain.length - 1];
      const newBlock = createInitialBlock(
        lastBlock.blockNumber + 1,
        `Block ${lastBlock.blockNumber + 1} Data`,
        lastBlock.currentHash
      );
      return [...prevChain, newBlock];
    });
  }, []);

  const updateBlockData = useCallback((blockId: string, newData: string) => {
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;

      const newChain = prevChain.map(b => ({...b})); // Deep copy objects in chain for immutability
      newChain[blockIndex].data = newData;
      return updateChainCascadingInternal(newChain, blockIndex);
    });
  }, []);

  const updateBlockNonce = useCallback((blockId: string, newNonce: number) => {
    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prevChain;

      const newChain = prevChain.map(b => ({...b}));
      newChain[blockIndex].nonce = newNonce;
      return updateChainCascadingInternal(newChain, blockIndex);
    });
  }, []);

  const mineBlock = useCallback(async (blockId: string) => {
    setMiningStates(prev => ({ ...prev, [blockId]: true }));

    // Initialize mining attempt for this blockId
    const initialBlockState = chain.find(b => b.id === blockId);
    if (initialBlockState) {
      const initialHash = calculateHash(initialBlockState.blockNumber, 0, initialBlockState.data as string, initialBlockState.previousHash);
      setMiningAttempts(prev => ({ ...prev, [blockId]: { nonce: 0, hash: initialHash } }));
    }

    await new Promise(resolve => setTimeout(resolve, 0)); // UI update for mining start

    setChain((prevChain) => {
      const blockIndex = prevChain.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) {
        setMiningStates(prev => { const ns = { ...prev }; delete ns[blockId]; return ns; });
        setMiningAttempts(prev => { const na = { ...prev }; delete na[blockId]; return na; });
        return prevChain;
      }

      const newChain = prevChain.map(b => ({...b}));
      const blockToMine = newChain[blockIndex];
      let foundNonce = blockToMine.nonce;

      for (let i = 0; i <= MAX_NONCE; i++) {
        const currentHashAttempt = calculateHash(blockToMine.blockNumber, i, blockToMine.data as string, blockToMine.previousHash);
        if (i % 200 === 0) { // Update attempts periodically
          setMiningAttempts(prev => ({ ...prev, [blockId]: { nonce: i, hash: currentHashAttempt } }));
          // Consider adding a small delay here if UI struggles, but setTimeout(0) might be enough
        }
        if (checkValidity(currentHashAttempt)) {
          foundNonce = i;
          break;
        }
      }
      newChain[blockIndex].nonce = foundNonce;
      const finalChain = updateChainCascadingInternal(newChain, blockIndex);
      setMiningStates(prev => { const ns = { ...prev }; delete ns[blockId]; return ns; });
      setMiningAttempts(prev => { const na = { ...prev }; delete na[blockId]; return na; });
      return finalChain;
    });
  }, [chain]); // Added chain to dependencies as it's used for initialBlockState

  const removeBlock = useCallback((blockIdToRemove: string) => {
    setChain(prevChain => {
      const blockIndex = prevChain.findIndex(b => b.id === blockIdToRemove);
      if (blockIndex === -1) return prevChain;

      let newChain = prevChain.filter(block => block.id !== blockIdToRemove).map(b => ({...b}));
      if (newChain.length === 0) return [];

      let startIndexForCascade = blockIndex;

      if (blockIndex === 0 && newChain.length > 0) {
         newChain[0].previousHash = '0'.repeat(64);
         // Re-number subsequent blocks
         for(let i = 0; i < newChain.length; i++) {
            newChain[i].blockNumber = i + 1;
         }
         startIndexForCascade = 0;
      } else if (blockIndex < newChain.length) {
        // A block from middle was removed, no renumbering, just update from that index
        startIndexForCascade = blockIndex;
      } else { // Last block was removed
        startIndexForCascade = newChain.length > 0 ? newChain.length -1 : 0;
      }

      return updateChainCascadingInternal(newChain, startIndexForCascade);
    });
  }, []);

  return {
    chain,
    miningStates,
    miningAttempts,
    initializeChain,
    addBlock,
    resetChain,
    updateBlockData,
    updateBlockNonce,
    mineBlock,
    removeBlock,
  };
};

export default useSimpleChain;
