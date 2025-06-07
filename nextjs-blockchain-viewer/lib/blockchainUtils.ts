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
