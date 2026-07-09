# Wallet Balance Checker

[![CI/CD](https://github.com/akordavid373/wallet-balance-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/akordavid373/wallet-balance-checker/actions/workflows/ci.yml)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://akordavid373.github.io/wallet-balance-checker/)

A **production-grade** multi-wallet Stellar dashboard with **Soroban smart contract** integration, **inter-contract communication**, real-time event streaming, CI/CD pipeline, and mobile-responsive design.

**[Live Demo](https://akordavid373.github.io/wallet-balance-checker/)** &mdash; requires Freighter browser extension on Testnet.

---

## Features

### Level 1 &mdash; Wallet Basics
- **Freighter Wallet** &mdash; Connect via Freighter browser extension (Stellar Testnet)
- **Multi-Account Balances** &mdash; Track any Stellar public key (add by key or from Freighter)
- **Send XLM** &mdash; Sign and submit payments through Freighter with real-time feedback
- **Transaction Feedback** &mdash; Success/failure state with transaction hash, amount, destination, StellarExpert link
- **All Assets** &mdash; View native XLM and issued token balances
- **Account Details** &mdash; Sequence number, signers, thresholds, sub-entries
- **Transaction History** &mdash; Browse recent operations per account
- **Testnet Funding** &mdash; One-click Friendbot funding for new accounts

### Level 2 &mdash; Soroban Smart Contracts
- **WalletRegistry Contract** &mdash; Deployed on Stellar Testnet (`CDUSF32RXYV7VQD272XKF24RCNYFWSV6Y6CGFCLUVDOPRJLI7BOK5G3V`)
- **Contract Calls from Frontend** &mdash; Register/unregister wallets on-chain via Freighter-signed Soroban transactions
- **Real-Time Event Streaming** &mdash; Polls Soroban RPC for contract events with smart deduplication, event count tracking, auto-reconnect (15s interval)
- **Multi-Wallet Registration** &mdash; Register any Stellar address on the contract with a human-readable label
- **Error Type Handling** (4 types): Auth, Contract, Network, RPC

### Level 3 &mdash; Advanced
- **Inter-Contract Communication** &mdash; Vault contract calls WalletRegistry's `is_registered` via `env.invoke_contract()` to authorize withdrawals
- **Vault Panel** &mdash; Full create/deposit/withdraw UI for the Vault contract with balance display and cross-contract status
- **Mobile Responsive** &mdash; Responsive layout with touch-friendly targets, stacked cards, scrollable tabs (tested at 375px, 768px, 1280px+)
- **Toast Notification System** &mdash; Global toast notifications for transactions, events, and errors (auto-dismiss after 4s)
- **Network Status Indicator** &mdash; Live Horizon health check (online/degraded/offline) with 30s polling
- **Production Architecture** &mdash; Centralized config, service layer, typed env vars, retry logic, error classification
- **CI/CD Pipeline** &mdash; 4 parallel jobs: lint, contracts (build+test+artifact upload), build, E2E tests, deploy to GitHub Pages
- **Deployment Verification** &mdash; Automated post-deploy script to verify contract reachability on Soroban RPC and Horizon
- **Contract Build Scripts** &mdash; `npm run compile:contracts` compiles all Soroban contracts; `npm run deploy:contracts` compiles & deploys

---

## Prerequisites

- [Freighter](https://freighter.app/) browser extension
- A Stellar wallet on **Testnet** network
- Node.js 18+
- Rust toolchain (for contract development)
- Stellar CLI (for contract deployment)

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Connect Freighter Wallet**.

### Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Horizon API endpoint |
| `VITE_SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint |
| `VITE_WALLET_REGISTRY_ID` | Deployed contract ID | WalletRegistry contract |
| `VITE_VAULT_CONTRACT_ID` | (optional) | Vault contract |
| `VITE_NETWORK_PASSPHRASE` | Testnet | Stellar network passphrase |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run compile:contracts` | Compile all Soroban contracts to WASM |
| `npm run deploy:contracts` | Compile and deploy all contracts to Testnet |
| `npm run deploy:scripts` | Full deployment via shell script with init & verification |
| `npm run verify:deploy <CONTRACT_ID>` | Verify a deployed contract is reachable |
| `npm run test:contracts` | Run Rust unit tests for all contracts |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run all tests (contracts + E2E) |

---

## Contracts

### WalletRegistry

Deployed on Stellar Testnet. Stores wallet addresses with labels and emits events.

| Property | Value |
|---|---|
| Network | Stellar Testnet |
| Contract ID | `CDUSF32RXYV7VQD272XKF24RCNYFWSV6Y6CGFCLUVDOPRJLI7BOK5G3V` |
| Wasm Hash | `1f9a37dd06377619a54fe22acb51b37b289eb0164e42d37dbf884ff1fac9492e` |
| Source | `contracts/wallet-registry/` |

#### Exported Functions

| Function | Args | Returns | Description |
|---|---|---|---|
| `register` | `wallet: Address`, `label: String` | `WalletInfo` | Register a wallet (auth required) |
| `remove_wallet` | `wallet: Address` | `()` | Remove a wallet registration |
| `get_wallet` | `wallet: Address` | `WalletInfo` | Get wallet info |
| `get_all_wallets` | | `Vec<(Address, WalletInfo)>` | List all registered wallets |
| `get_wallet_count` | | `u32` | Total registered count |
| `is_registered` | `wallet: Address` | `bool` | Check if registered |
| `update_label` | `wallet: Address`, `new_label: String` | `WalletInfo` | Update wallet label |

#### Events

| Event | Topics | Payload |
|---|---|---|
| `WalletRegistered` | `("reg", "wallet")` | `(Address, String, u64)` |
| `WalletRemoved` | `("rem", "wallet")` | `(Address, u64)` |

### Vault

Demonstrates **inter-contract communication** by calling `WalletRegistry.is_registered` via `env.invoke_contract()`.

| Property | Value |
|---|---|
| Network | Stellar Testnet |
| Source | `contracts/vault/` |
| Artifact | `contracts/vault/artifacts/vault.wasm` |

#### Exported Functions

| Function | Args | Returns | Description |
|---|---|---|---|
| `init` | `registry_contract: Address` | `()` | Initialize with WalletRegistry contract address |
| `create_vault` | `owner: Address` | `Result<VaultInfo, VaultError>` | Create a vault (requires registry membership) |
| `deposit` | `owner: Address`, `amount: i128` | `Result<VaultInfo, VaultError>` | Deposit into vault |
| `withdraw` | `owner: Address`, `amount: i128`, `to: Address` | `Result<VaultInfo, VaultError>` | Withdraw (checks registry membership) |
| `get_vault` | `owner: Address` | `Result<VaultInfo, VaultError>` | Get vault info |
| `get_vault_count` | | `u32` | Total vault count |
| `get_registry_address` | | `Address` | Get the registry contract address |

---

## Architecture

```
┌───────────────────────┐
│     Freighter API     │
│  (browser extension)  │
└─────────┬─────────────┘
          │ getAddress / signTransaction
          ▼
┌──────────────────────────────────────────────────┐
│            React Frontend                     │
│                                                │
│  ┌─────────────┐  ┌──────────────────────┐     │
│  │  useWallet     │  │  useContract     │     │
│  │  hook          │  │  hook            │     │
│  └───────┬───────┘  └────────┬─────────┘     │
│          │                    │                  │
│  ┌───────┴───────┐  ┌────────┴─────────┐     │
│  │  useVault     │  │  Toast System    │     │
│  │  hook         │  │  Network Status  │     │
│  └───────┬───────┘  └─────────────────┘     │
│          │                                     │
│  ┌───────┴─────────────────┐                   │
│  │  Service Layer           │                   │
│  │  (services.ts + helpers) │                   │
│  │  - fetchBalance          │                   │
│  │  - buildAndSendContract  │                   │
│  │  - simulateView          │                   │
│  │  - fetchContractEvents   │                   │
│  └───────┬─────────────────┘                   │
│          │                                     │
│          ▼               ▼                     │
│  Horizon REST     Soroban RPC                │
└──────────────────────────────────────────────────┘
          │                     │
          ▼                     ▼
┌──────────────┐    ┌──────────────────────┐
│ Stellar       │    │ Soroban Contracts    │
│ Testnet       │    │ ┌────────────────┐   │
│ (Horizon)     │    │ │WalletRegistry  │   │
│               │    │ │ - register     │   │
│               │    │ │ - is_registered│   │
│               │    │ └───────┬────────┘   │
│               │    │         │ invoke      │
│               │    │ ┌───────▼────────┐   │
│               │    │ │ Vault          │   │
│               │    │ │ - create_vault │   │
│               │    │ │ - deposit      │   │
│               │    │ │ - withdraw     │   │
│               │    │ └────────────────┘   │
│               │    └──────────────────────┘
└──────────────┘
```

---

## How It Works

### Wallet (Level 1)
1. **Connection** &mdash; Uses `@stellar/freighter-api` to detect, connect, and request access from Freighter
2. **Network** &mdash; Enforces Stellar Testnet; rejects connections on Mainnet/Futurenet
3. **Balances** &mdash; Fetches account data from Horizon REST API
4. **Transactions** &mdash; Builds payment operations with `@stellar/stellar-sdk`, signs via Freighter, submits to Horizon
5. **Feedback** &mdash; Parses Horizon response with StellarExpert links and copy functionality

### Contract (Level 2)
1. **Deployed Contract** &mdash; `WalletRegistry` Rust smart contract deployed on Testnet
2. **Registration** &mdash; Calls `register(wallet, label)` which requires auth and emits a `WalletRegistered` event
3. **Read-Only Queries** &mdash; Simulates `get_all_wallets()` via Soroban RPC without signing
4. **Event Streaming** &mdash; Uses `server.getEvents()` with deduplication, event count tracking, and auto-reconnect
5. **Error Handling** &mdash; Categorizes auth, contract, network, and RPC errors with distinct styling

### Inter-Contract Communication (Level 3)
1. **Vault Contract** &mdash; Deployed separately; stores vault balances per wallet address
2. **Cross-Contract Call** &mdash; `create_vault` and `withdraw` call `WalletRegistry.is_registered` via `env.invoke_contract()`
3. **Authorization** &mdash; Only wallets registered in the WalletRegistry can create vaults or withdraw funds
4. **Frontend Integration** &mdash; Toggle between Registry and Vault panels; create/deposit/withdraw from the UI

---

## Project Structure

```
wallet-balance-checker/
├── .env.example                # Environment variable template
├── .github/workflows/ci.yml    # CI/CD: lint, contracts, build, E2E, deploy
├── contracts/
│   ├── wallet-registry/         # WalletRegistry Soroban contract (Rust)
│   │   └── contracts/wallet-registry/src/
│   │       ├── lib.rs           # 7 functions, 2 events, 3 error types
│   │       └── test.rs           # 12 unit tests
│   └── vault/                   # Vault with inter-contract communication
│       └── contracts/vault/src/
│           ├── lib.rs           # 7 functions, 3 events, 4 error types
│           ├── test.rs            # 16 unit tests
│           └── artifacts/       # Pre-compiled WASM binary
├── e2e/
│   └── dashboard.spec.ts       # 10 Playwright E2E tests (responsive + error)
├── scripts/
│   ├── deploy-contracts.sh     # Full deployment pipeline
│   └── deploy-verify.js        # Post-deployment verification
├── src/
│   ├── config.ts               # Environment config with defaults
│   ├── App.tsx                 # Root with ErrorBoundary
│   ├── components/
│   │   ├── WalletDashboard.tsx # Main UI (multi-account, send, vault, registry)
│   │   ├── ContractPanel.tsx   # Registry registration UI + event feed
│   │   ├── VaultPanel.tsx      # Vault create/deposit/withdraw UI
│   │   ├── ErrorBoundary.tsx   # Class-based error boundary with reset + reload
│   │   ├── LoadingSkeleton.tsx# Skeleton loaders + spinner
│   │   ├── NetworkStatus.tsx  # Horizon health indicator
│   │   └── Toast.tsx           # Global toast notification system
│   ├── hooks/
│   │   ├── useWallet.ts       # Wallet logic (connect, XLM send, multi-account)
│   │   ├── useContract.ts      # Registry contract calls + event polling
│   │   └── useVault.ts         # Vault contract calls (create/deposit/withdraw)
│   └── utils/
│       ├── helpers.ts          # shortKey, fmtBalance, retry, AppError, classifyError
│       └── services.ts         # Horizon, Soroban RPC, contract call functions
├── screenshots/                  # UI screenshots
├── playwright.config.ts      # E2E test configuration
└── README.md
```

---

## Deployment

### Contracts

Requires the `stellar` CLI and a funded `deployer` identity:

```bash
# Set up deployer identity (one-time)
stellar keys generate deployer
stellar keys fund deployer --network testnet

# Full deployment pipeline
npm run deploy:scripts

# Or manually:
npm run compile:contracts
npm run deploy:contracts
```

After deploying, update `.env`:
```
VITE_WALLET_REGISTRY_ID=NEW_CONTRACT_ID
VITE_VAULT_CONTRACT_ID=NEW_VAULT_ID
```

### Frontend

GitHub Actions automatically builds and deploys to GitHub Pages on every push to `master`.

CI/CD Pipeline:
| Job | Trigger | Description |
|---|---|---|
| `lint` | PR/push to master | ESLint check |
| `contracts` | PR/push to master | Build + test both smart contracts, upload WASM artifacts |
| `build` | PR/push to master | TypeScript check + Vite production build |
| `e2e` | PR/push to master | Playwright E2E tests (requires build) |
| `deploy` | Merge to master | GitHub Pages deployment |

---

## Test Summary

| Test Suite | Count | Coverage |
|---|---|---|
| WalletRegistry Rust tests | 12 | Register, remove, update, errors, events, edge cases |
| Vault Rust tests | 16 | Create, deposit, withdraw, errors, cross-contract, events, edge cases |
| Playwright E2E tests | 10 | Connect screen, prerequisites, error states, responsive layouts |
| **Total** | **38** | Contracts + Frontend |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety (strict mode) |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **@stellar/freighter-api** | Wallet connection & transaction signing |
| **@stellar/stellar-sdk** | Transaction building, XDR, Soroban RPC |
| **Horizon API** | On-chain data (balances, transactions, accounts) |
| **Soroban RPC** | Contract invocation, simulation, event polling |
| **Soroban SDK (Rust)** | Smart contract development (`soroban-sdk` v26) |
| **Playwright** | E2E browser testing |
| **GitHub Actions** | CI/CD pipeline |
| **GitHub Pages** | Frontend hosting |

---

## License

MIT