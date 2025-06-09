import SHA256 from 'crypto-js/sha256';

export const DIFFICULTY = '0000'; // Difficulty prefix for a valid hash
export const MAX_NONCE = 500000; // Max iterations for mining, adjust as needed for performance

export interface CoinbaseTransactionType {
  to: string; // Recipient of the minted coins
  value: string | number; // Amount minted
  // No 'from' field, as it's minted
  // No 'id' needed if there's only one per block and it's part of the block
}

export interface TransactionType {
  id: string;
  from: string;
  to: string;
  value: string | number;
  timestamp?: number;
}

export interface BlockType {
  id: string;
  blockNumber: number;
  nonce: number;
  coinbase?: CoinbaseTransactionType; // Optional coinbase transaction
  data: TransactionType[] | string; // Regular P2P transactions or simple string
  previousHash: string;
  currentHash: string;
  isValid: boolean;
}

const stringifyCoinbaseForHashing = (coinbase?: CoinbaseTransactionType): string => {
  if (!coinbase) return '';
  // Consistent stringification for coinbase tx
  return `COINBASE:${JSON.stringify({to: coinbase.to, value: coinbase.value})}`;
};

const stringifyDataForHashing = (data: TransactionType[] | string): string => {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data); // For regular transactions
};

export const calculateHash = (
  blockNumber: number,
  nonce: number,
  data: TransactionType[] | string,
  previousHash: string,
  coinbase?: CoinbaseTransactionType // Add coinbase to hash calculation
): string => {
  const coinbaseString = stringifyCoinbaseForHashing(coinbase);
  const dataString = stringifyDataForHashing(data);
  // Order: Block#, Nonce, Coinbase Tx (if any), Regular Txs/Data, PrevHash
  return SHA256(
    blockNumber.toString() +
    nonce.toString() +
    coinbaseString + // Include coinbase string
    dataString +
    previousHash
  ).toString();
};

export const checkValidity = (hash: string): boolean => {
  return hash.startsWith(DIFFICULTY);
};

export const createInitialBlock = (
  blockNumber: number,
  data: TransactionType[] | string = '',
  previousHash: string = '0'.repeat(64),
  initialNonce?: number,
  coinbase?: CoinbaseTransactionType // Add coinbase to block creation
): BlockType => {
  let nonce = initialNonce ?? 0;
  let currentHash = calculateHash(blockNumber, nonce, data, previousHash, coinbase);
  let isValid = checkValidity(currentHash);

  if (initialNonce === undefined && !isValid) {
    let mined = false;
    // Limit initial mining attempts, especially if coinbase/data makes it complex
    const miningLimit = Array.isArray(data) && data.length > 0 ? 50000 : 150000;
    for (let i = 0; i <= miningLimit; i++) {
      const hash = calculateHash(blockNumber, i, data, previousHash, coinbase);
      if (checkValidity(hash)) {
        nonce = i;
        currentHash = hash;
        isValid = true;
        mined = true;
        break;
      }
    }
    if (!mined) {
      console.warn(
        `Could not mine initial block ${blockNumber} with coinbase "${stringifyCoinbaseForHashing(coinbase)}" and data "${stringifyDataForHashing(data)}" quickly. Using nonce 0.`
      );
      nonce = 0;
      currentHash = calculateHash(blockNumber, nonce, data, previousHash, coinbase);
      isValid = checkValidity(currentHash);
    }
  }

  return {
    id: `block-${blockNumber}-${new Date().getTime()}-${Math.random()}`,
    blockNumber,
    nonce,
    coinbase, // Store coinbase tx
    data,
    previousHash,
    currentHash,
    isValid,
  };
};

// Renaming to be more generic as it's used by both main blockchain and coinbase chains
export const updateChainCascading = (chain: BlockType[], startIndex: number): BlockType[] => {
  const updatedChain = [...chain];
  for (let i = startIndex; i < updatedChain.length; i++) {
    if (i > 0) {
      updatedChain[i].previousHash = updatedChain[i - 1].currentHash;
    } else {
      // This case should ideally be handled carefully:
      // If the first block (index 0) is being re-validated, its previousHash should remain "0...0"
      // This function assumes if i === 0 and it's in this loop, it might be a new genesis after deletion.
      // However, typically for a simple data/nonce change, startIndex would be >= 0,
      // and if it's 0, previousHash should not change from "0...0".
      // The logic in pages usually sets previousHash to "0...0" *before* calling this if a new genesis is formed.
      // So, this else might be redundant if page logic is correct, or needs care.
      // For now, keeping it as it was in page context.
      updatedChain[i].previousHash = "0".repeat(64);
    }

    const block = updatedChain[i];
    // Use the existing generic calculateHash which handles coinbase and P2P tx array in data
    updatedChain[i].currentHash = calculateHash(
      block.blockNumber,
      block.nonce,
      block.data,
      block.previousHash,
      block.coinbase
    );
    updatedChain[i].isValid = checkValidity(updatedChain[i].currentHash);
  }
  return updatedChain;
};

// --- Coinbase Specific Utilities ---
// Note: These are very similar to the generic ones but are kept separate
// if future coinbase-specific hashing or block properties diverge significantly.
// For now, they primarily ensure that block.data is treated as TransactionType[]
// and block.coinbase is included in hashing.

export const calculateCoinbaseBlockHash = (
  blockNumber: number,
  nonce: number,
  coinbaseTx: CoinbaseTransactionType | undefined,
  p2pTxs: TransactionType[] | string, // Allow string for flexibility, though coinbase page uses TransactionType[]
  previousHash: string
): string => {
  // The generic calculateHash already handles coinbase and different data types.
  // This function essentially just ensures the type signature for p2pTxs if it's always an array for coinbase blocks.
  return calculateHash(blockNumber, nonce, p2pTxs, previousHash, coinbaseTx);
};

export const checkCoinbaseValidity = (hash: string): boolean => {
  return checkValidity(hash); // Directly uses the generic checkValidity
};

export const createCoinbaseBlock = (
  blockNumber: number,
  coinbaseTx: CoinbaseTransactionType,
  p2pTxs: TransactionType[],
  previousHash: string,
  initialNonce?: number
): BlockType => {
  // The generic createInitialBlock can be used if data is passed as TransactionType[] and coinbase is provided.
  return createInitialBlock(blockNumber, p2pTxs, previousHash, initialNonce, coinbaseTx);
};

export const updateCoinbaseChainCascading = (chain: BlockType[], startIndex: number): BlockType[] => {
  // This function is identical to updateChainCascading if calculateHash correctly handles
  // the structure of blocks in the coinbase chain (i.e., block.data as TransactionType[] and block.coinbase).
  // The generic updateChainCascading in this file already does that.
  return updateChainCascading(chain, startIndex);
};
