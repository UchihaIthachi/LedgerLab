```markdown
# Blockchain Explained

A blockchain is a distributed, immutable ledger. This means it's a record of transactions or data that is shared among many computers and, once something is recorded, it cannot be easily altered. This technology is the foundation for cryptocurrencies like Bitcoin, but its applications go far beyond.

## Core Concepts

### 1. Blocks

- **Theory:** A block is a container for data. In the context of a cryptocurrency, this data primarily consists of a bundle of transactions. Each block also contains a unique identifier called a **hash** (explained next) and the hash of the _previous_ block in the chain. This linkage is what forms the "chain."
- **Project Illustration:**
  - The demo visually represents blocks as distinct units, each with fields for "Block #" (its sequence), "Nonce", "Data", "Prev" (previous hash), and "Hash".
  - In the "Block" section of the demo ([/block](http://localhost:3000/block)), you can see a single block and manipulate its contents.
  - In the "Blockchain" section ([/blockchain](http://localhost:3000/blockchain)), you see a series of these blocks linked together.

### 2. Hashes (SHA-256)

- **Theory:** A hash is like a digital fingerprint for data. It's a unique string of characters generated from an input. Even a tiny change in the input data will result in a completely different hash. Blockchains typically use cryptographic hash functions like SHA-256 (Secure Hash Algorithm 256-bit).
- **Project Illustration:**
  - Each block in the demo prominently displays its calculated SHA-256 hash in the "Hash" field.
  - If you type any character into the "Data" field of a block, you'll see its "Hash" value change instantly. This demonstrates the sensitivity of hash functions.
  - The demo highlights a block in green if its hash meets a certain criteria (e.g., starts with "0000"), indicating a "signed" or "valid" block in the context of the demo's rules. If the hash doesn't meet the criteria, the block is highlighted in red.

### 3. The Chain & Immutability

- **Theory:** Each block (except the very first one, called the "genesis block") stores the hash of the previous block. This creates a chronological chain. If someone tries to tamper with the data in an old block, its hash will change. Since this hash was recorded in the _next_ block, that next block also becomes invalid. This cascading invalidation makes blockchains extremely secure and immutable. Changing a block requires re-calculating its hash and the hashes of _all subsequent blocks_.
- **Project Illustration:**
  - In the "Blockchain" section ([/blockchain](http://localhost:3000/blockchain)), observe the "Prev" field in each block. It contains the hash of the block before it.
  - If you change the data in, for example, Block #2, its own hash will change. This will cause Block #3 (which stored Block #2's old hash in its "Prev" field) to become invalid (turn red). This visual chain reaction continues all the way to the end of the chain, clearly showing the immutability concept.

### 4. Nonce and Mining

- **Theory:** To add a new block to the chain, "miners" compete to solve a computationally difficult puzzle. This usually involves finding a specific number called a "Nonce" (Number used once). When this nonce is combined with the block's other data and hashed, the resulting hash must meet certain criteria (e.g., start with a specific number of zeros). This process is called "mining" and is what makes adding new blocks difficult and resource-intensive, further securing the chain. The difficulty can be adjusted by changing the criteria for the hash (e.g., requiring more leading zeros).
- **Project Illustration:**
  - Each block has a "Nonce" field.
  - The "Mine" button triggers a script (`public/javascripts/blockchain.js`) that iterates through different nonce values until it finds one that results in a hash starting with "0000" (the demo's difficulty setting, which can be adjusted in the JS file).
  - When you change data in a block, it turns red (invalid). Clicking "Mine" will find a new nonce to make the block valid again (green). If you do this on a block in the middle of the chain, you'll then have to re-mine all subsequent blocks as well.

### 5. Distributed Ledger Technology (DLT)

- **Theory:** Instead of one central authority managing the ledger, a blockchain is typically managed by a distributed network of computers (peers). Each peer holds a copy of the ledger. When a new block is mined, it's broadcast to the network, and each peer validates and adds it to their copy of the chain. This decentralization enhances security and resilience. If one peer is compromised or goes offline, the network continues to operate.
- **Project Illustration:**
  - The "Distributed" section ([/distributed](http://localhost:3000/distributed)) shows three "Peers" (Peer A, Peer B, Peer C), each with an identical copy of the blockchain.
  - If you modify data in a block on Peer A's chain, only Peer A's chain is initially affected and becomes invalid. Peer B and Peer C still have the original, valid chain.
  - You can then re-mine the blocks on Peer A's chain. However, its final hash will now be different from Peer B and Peer C. This illustrates how different versions of the truth can arise and implicitly shows the need for a consensus mechanism (though the demo doesn't implement one) for the peers to agree on the correct chain.

### 6. Tokens and Coinbase Transactions

- **Theory:** Blockchains are often used to track the movement of digital assets or "tokens" (like cryptocurrencies). Transactions detailing these movements are bundled into the data part of blocks. A special type of transaction, often called a "coinbase" transaction, is usually the first in a block and is used to create new tokens, often as a reward for the miner who successfully mined that block.
- **Project Illustration:**
  - The "Tokens" section ([/tokens](http://localhost:3000/tokens)) shows blocks where the "Data" field is replaced by a list of transactions (e.g., "Darcy sends $25 to Bingley"). Changing any part of these transactions will invalidate the block's hash.
  - The "Coinbase" section ([/coinbase](http://localhost:3000/coinbase)) demonstrates this concept. Each block includes a coinbase transaction (e.g., "$100 to Anders") which mints new currency, alongside other peer-to-peer transactions. This shows how new value can be introduced into the system.

## How This Project Illustrates Blockchain

This project provides an interactive, visual way to understand the fundamental mechanics of a blockchain:

- **Hands-on Hashing:** You can directly manipulate data and see hashes change in real-time.
- **Visual Immutability:** Altering a block clearly shows the "breaking" of the chain, making the concept of an immutable ledger tangible.
- **Simplified Mining:** The "Mine" button demystifies the concept of mining by showing the search for a valid nonce.
- **Decentralization Demoed:** The "Distributed" view makes it easy to see how multiple peers maintain copies of the chain and how discrepancies can arise.
- **Transaction Flow:** The "Tokens" and "Coinbase" views show how financial transactions can be recorded on a blockchain.

By playing with the different sections, users can gain an intuitive grasp of these core blockchain principles without needing to dive deep into complex code or mathematics initially.

---
```
