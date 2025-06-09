# Understanding Distributed Ledger Technology (DLT)

Instead of one central authority managing the ledger, a blockchain is typically managed by a **distributed network of computers**, often called **peers**. Each peer in this network holds a complete copy of the ledger.

When a new block of transactions is verified and "mined" (added to the chain), it's broadcast to all peers in the network. Each peer then independently validates this new block and, if valid, adds it to their own copy of the blockchain.

This **decentralization** offers several key advantages:
*   **Enhanced Security:** With many copies, it's much harder for a malicious actor to tamper with the ledger. They would need to control a majority of the network's computing power to force a fraudulent change.
*   **Increased Resilience:** If one peer (or even several) goes offline or is compromised, the network as a whole can continue to operate because other peers still have valid copies of the ledger.
*   **Transparency (often):** In public blockchains, anyone can typically join the network and view the ledger's history.

## How it's Shown in this Demo

The "Distributed Ledger" section of this demo ([/distributed](/distributed)) provides a simplified illustration of these concepts:

*   You'll see three distinct "Peers" labeled Peer A, Peer B, and Peer C. Initially, each peer has an identical copy of the same blockchain.
*   **Experiment with Tampering:** If you modify data in a block on, for example, Peer A's chain, you'll observe that only Peer A's chain is immediately affected and becomes invalid (its blocks may turn red). Peer B and Peer C will still hold the original, valid version of the chain.
*   **Independent Mining:** You can then try to re-mine the blocks on Peer A's chain to make it valid again according to its new data.
*   **Divergence:** After re-mining, Peer A's chain will be internally consistent and valid. However, its final hash (and potentially intermediate hashes) will now likely be different from the final hashes of Peer B's and Peer C's chains. This demonstrates how different "versions of the truth" can arise in a distributed system if changes aren't propagated and agreed upon by all peers.

This demo visually highlights the concept of data redundancy and how individual peers manage their chains. It also implicitly shows why **consensus mechanisms** (rules for how peers agree on the true state of the chain, which this demo does not implement) are crucial in real-world blockchain systems to resolve discrepancies and maintain a single, authoritative ledger across the network.
