# Wallet Balance Checker

A Stellar wallet balance checker with Freighter integration. View XLM balances for
multiple accounts, send payments, and explore account details on the Stellar Testnet.

## Features

- **Freighter Wallet** &mdash; Connect via Freighter browser extension
- **Multi-Account Balances** &mdash; Track any Stellar public key (add by key or from Freighter)
- **Send XLM** &mdash; Sign and submit payments through Freighter
- **All Assets** &mdash; View native and issued token balances
- **Account Details** &mdash; Sequence number, signers, thresholds, sub-entries
- **Transaction History** &mdash; Browse recent operations per account
- **Testnet Funding** &mdash; One-click Friendbot funding for new accounts
- **StellarExpert Links** &mdash; Quick access to on-chain explorer

## Prerequisites

- [Freighter](https://freighter.app/) browser extension
- A Stellar wallet on **Testnet** network

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Connect Freighter Wallet**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Tech Stack

- **React** &mdash; UI framework
- **TypeScript** &mdash; Type safety
- **Vite** &mdash; Build tool
- **Tailwind CSS** &mdash; Styling
- **@stellar/freighter-api** &mdash; Wallet connection
- **@stellar/stellar-sdk** &mdash; Transaction building
- **Horizon API** &mdash; On-chain data queries

## Project Structure

```
src/
├── components/
│   └── WalletDashboard.tsx    # Main UI
├── hooks/
│   └── useWallet.ts           # All wallet logic
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Tailwind imports
```

## License

MIT
