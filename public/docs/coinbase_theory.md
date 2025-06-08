# Coinbase Transactions and Token Creation

Blockchains are often used to track the movement of digital assets or "tokens" (like cryptocurrencies). Transactions detailing these movements are bundled into the data part of blocks.

A special type of transaction, often called a **coinbase transaction**, is usually the first in a block and is used to create new tokens. This is often framed as a reward for the miner who successfully mined that block.

## How it's Shown in this Demo

The "Coinbase" section of this demo ([/coinbase](/coinbase)) illustrates this concept directly:
*   Each block you see includes a distinct coinbase transaction (e.g., "$100 to Anders"). This transaction effectively "mints" new currency into the system.
*   Alongside the coinbase transaction, blocks can also contain regular peer-to-peer transactions.
*   This setup demonstrates how new value can be introduced and recorded on the blockchain.

The "Tokens" section ([/tokens](/tokens)) also relates to this by showing how blocks can primarily focus on listing various peer-to-peer transactions once tokens are in circulation. Changing any part of these transactions will invalidate the block's hash, maintaining the integrity of the token ledger.
