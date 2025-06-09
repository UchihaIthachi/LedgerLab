# ⚙️ LedgerLab

**LedgerLab** is an interactive, educational platform that visually demonstrates core blockchain and cryptographic concepts through hands-on simulations. Built with [Next.js](https://nextjs.org/) and TypeScript, it helps users understand how blockchains work — from mining and immutability to digital signatures and zero-knowledge proofs.

Inspired by [Anders Brownworth’s blockchain demo](https://andersbrownworth.com/blockchain), this modernized version includes an expanded set of cryptographic modules, improved UI/UX, and a developer-friendly architecture for experimentation and learning.

---

## ✨ Features

- ⛓️ **Blockchain Explorer** – Interact with a chain of blocks and learn about hashing, nonces, and immutability.
- 🧮 **Mining Simulator** – Visualize how Proof-of-Work is used to validate blocks.
- 🔐 **Key Generation** – Generate public/private key pairs using elliptic curve cryptography (`secp256k1`).
- ✍️ **Digital Signatures** – Sign messages and transactions, and verify them using public keys.
- 🕵️ **Zero-Knowledge Proofs (ZKP)** – Use the map-coloring game to explore knowledge proofs without revealing information.
- 🔁 **Distributed Ledger View** – See how tampering in one peer's chain leads to consensus breakdown.

---

## 🚀 Getting Started

Clone the repository and start the development server:

```bash
npm install
npm run dev
# or
# yarn dev
# or
# pnpm dev
# or
# bun dev
```

Visit: http://localhost:3000

### 🧪 Explore the Modules

| Path                              | Description                                        |
| --------------------------------- | -------------------------------------------------- |
| `/blockchain/block`               | View and modify a single block’s data and nonce    |
| `/blockchain`                     | Explore a linked series of blocks (a blockchain)   |
| `/blockchain/distributed`         | Simulate blockchains across multiple peers         |
| `/blockchain/tokens`              | Visualize simple token-based transactions          |
| `/blockchain/coinbase`            | Learn how coinbase transactions mint new tokens    |
| `/public-private-key/keys`        | Generate ECC-based key pairs                       |
| `/public-private-key/signatures`  | Sign and verify messages using keys                |
| `/public-private-key/transaction` | Simulate cryptographic blockchain transactions     |
| `/zero-knowledge-proof`           | Play with zero-knowledge proofs using map coloring |

---

## 🧱 Tech Stack

- **Next.js** – React-based frontend framework
- **TypeScript** – Static typing for JavaScript
- **Ant Design** – UI component library
- **Framer Motion** – Animation library
- **react-simple-maps** – Library for map visualizations
- **elliptic.js** – ECC crypto library
- **crypto-js** – Hashing library (includes SHA256)

---

## 📦 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

---

## 🤝 Contributing (Example)

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 🙏 Acknowledgements

This project is inspired by and builds upon the foundational work of Anders Brownworth, particularly his original [blockchain demonstration](https://andersbrownworth.com/blockchain).

Further development, modernization, and contributions by Harhana Lakshara Fernando.

---

## 📘 Learn More

- [Blockchain (Wikipedia)](https://en.wikipedia.org/wiki/Blockchain)
- [Public-Key Cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography)
- [Digital Signatures](https://en.wikipedia.org/wiki/Digital_signature)
- [Zero-Knowledge Proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)

💡 Ideal for students, educators, and developers learning how blockchain works at a fundamental level.
