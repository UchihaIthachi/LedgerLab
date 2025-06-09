import {
  calculateHash,
  checkValidity,
  createInitialBlock,
  DIFFICULTY,
  // BlockType, // Not strictly needed for these tests if we don't instantiate BlockType directly here
  CoinbaseTransactionType,
  TransactionDataType
} from '../blockchainUtils'; // Adjust path as needed

describe('blockchainUtils', () => {
  describe('calculateHash', () => {
    it('should calculate a consistent hash for the same input', () => {
      const hash1 = calculateHash(1, 123, 'data', 'prevHash');
      const hash2 = calculateHash(1, 123, 'data', 'prevHash');
      expect(hash1).toEqual(hash2);
    });

    it('should calculate different hashes for different inputs', () => {
      const hash1 = calculateHash(1, 123, 'data1', 'prevHash');
      const hash2 = calculateHash(1, 123, 'data2', 'prevHash');
      expect(hash1).not.toEqual(hash2);
    });

    it('should include coinbase transaction in hash calculation', () => {
      const coinbase: CoinbaseTransactionType = { to: 'miner', value: 50 };
      const hash1 = calculateHash(1, 123, 'data', 'prevHash', coinbase);
      const hash2 = calculateHash(1, 123, 'data', 'prevHash'); // Without coinbase
      const hash3 = calculateHash(1, 123, 'data', 'prevHash', { ...coinbase, value: 51 }); // Different coinbase
      expect(hash1).not.toEqual(hash2);
      expect(hash1).not.toEqual(hash3);
    });

    it('should include P2P transaction data in hash calculation', () => {
      const txDataArray: TransactionDataType[] = [{id: 'tx1', from: 'A', to: 'B', value: 10, signature: 'sigA'}];
      const txDataString = "Legacy string data";

      const hash1 = calculateHash(1, 123, txDataArray, 'prevHash');
      const hash2 = calculateHash(1, 123, txDataString, 'prevHash');
      const hash3 = calculateHash(1, 123, txDataArray, 'prevHash'); // Same as hash1
      const hash4 = calculateHash(1, 123, [{...txDataArray[0], value: 20}], 'prevHash'); // Different tx data

      expect(hash1).not.toEqual(hash2); // Array of tx vs string
      expect(hash1).toEqual(hash3);    // Same tx data
      expect(hash1).not.toEqual(hash4); // Different tx data
    });
  });

  describe('checkValidity', () => {
    it('should return true for a hash starting with the difficulty prefix', () => {
      expect(checkValidity(DIFFICULTY + 'abc')).toBe(true);
    });

    it('should return false for a hash not starting with the difficulty prefix', () => {
      expect(checkValidity('123' + DIFFICULTY + 'abc')).toBe(false);
      expect(checkValidity('0'.repeat(DIFFICULTY.length -1) + '1' + 'abc')).toBe(false);
    });
  });

  describe('createInitialBlock', () => {
    // Mock console.log to avoid polluting test output from mining attempts if any
    // This is a simple mock; more sophisticated mocking might be needed if console output is critical
    let consoleLogSpy: jest.SpyInstance;
    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should create a block with correct properties (no coinbase, no initial nonce)', () => {
      const block = createInitialBlock(1, 'test data', '0'.repeat(64));
      expect(block.blockNumber).toBe(1);
      expect(block.data).toBe('test data');
      expect(block.previousHash).toBe('0'.repeat(64));
      expect(block.coinbase).toBeUndefined();
      expect(block.currentHash).toBeDefined();
      // Since it mines if no nonce, it should be valid by default
      expect(checkValidity(block.currentHash)).toBe(true);
      expect(block.isValid).toBe(true);
    });

    it('should mine a valid block if no initialNonce is provided', () => {
      // This test might be slow if MAX_NONCE is very high or DIFFICULTY too hard for quick test
      // For actual CI, DIFFICULTY could be mocked or MAX_NONCE reduced in a test environment
      // For this exercise, we assume DIFFICULTY is small enough for a quick test
      const block = createInitialBlock(2, 'mine me', 'prevHash123');
      expect(checkValidity(block.currentHash)).toBe(true);
      expect(block.isValid).toBe(true);
    });

    it('should use initialNonce if provided and set validity accordingly', () => {
      const nonce = 12345; // Arbitrary nonce
      const expectedHash = calculateHash(3, nonce, 'data with nonce', 'prevHashABC');
      const expectedValidity = checkValidity(expectedHash);

      const block = createInitialBlock(3, 'data with nonce', 'prevHashABC', nonce);
      expect(block.nonce).toBe(nonce);
      expect(block.currentHash).toBe(expectedHash);
      expect(block.isValid).toBe(expectedValidity);
    });

    it('should correctly include coinbase data in the created block and its hash (mined)', () => {
        const coinbase: CoinbaseTransactionType = { to: 'minerXY', value: 100 };
        // No initial nonce, so it will mine
        const block = createInitialBlock(4, 'block with coinbase', 'prevHashXYZ', undefined, coinbase);
        expect(block.coinbase).toEqual(coinbase);
        expect(checkValidity(block.currentHash)).toBe(true); // Should be valid as it's mined
        expect(block.isValid).toBe(true);

        // Verify the hash was calculated with the coinbase data
        const hashWithoutCoinbaseForSameNonce = calculateHash(4, block.nonce, 'block with coinbase', 'prevHashXYZ', undefined);
        expect(block.currentHash).not.toEqual(hashWithoutCoinbaseForSameNonce);

        const expectedHashWithCoinbase = calculateHash(4, block.nonce, 'block with coinbase', 'prevHashXYZ', coinbase);
        expect(block.currentHash).toEqual(expectedHashWithCoinbase);
    });

    it('should correctly include P2P transaction data in the created block and its hash (mined)', () => {
      const txData: TransactionDataType[] = [{id: 'tx2', from: 'C', to: 'D', value: 25, signature: 'sigC'}];
      const block = createInitialBlock(5, txData, 'prevHashPQR', undefined);
      expect(block.data).toEqual(txData);
      expect(checkValidity(block.currentHash)).toBe(true);
      expect(block.isValid).toBe(true);

      const expectedHash = calculateHash(5, block.nonce, txData, 'prevHashPQR');
      expect(block.currentHash).toEqual(expectedHash);
    });
  });
});
