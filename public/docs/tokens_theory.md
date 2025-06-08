# Understanding Token Transactions in Blocks

Blockchains are frequently utilized to record and track the movement of digital assets, often referred to as **"tokens"** or cryptocurrencies. These tokens represent value and can be exchanged between participants in the network.

The core idea is that transactions detailing these movements (e.g., Person A sends X tokens to Person B) are collected and bundled together into the **data portion of a block**. Once a block is filled with transactions and successfully mined, it becomes a permanent part of the blockchain, creating an immutable record of those token transfers.

## How it's Shown in this Demo

The "Tokens" section of this demo ([/tokens](/tokens)) is designed to illustrate this specific aspect:

*   You will see blocks where the primary content of the "Data" field is a **list of individual transactions**. For example, a block might contain entries like "Darcy sends $25 to Bingley" or "Elizabeth gives $10 to Jane."
*   Each of these transactions is a crucial piece of the block's data.
*   **Immutability in Action:** If you attempt to change any detail of any transaction within a block (e.g., alter an amount, a sender, or a recipient), the overall hash of that block will change. This, in turn, will invalidate the block and potentially subsequent blocks in the chain, reinforcing the security and integrity of the transaction record.

This demonstration focuses on how groups of transactions are stored within blocks to represent the flow of tokens or digital value. While the "Coinbase" demo shows how new tokens might be minted, the "Tokens" demo emphasizes how existing tokens are transferred and recorded.
