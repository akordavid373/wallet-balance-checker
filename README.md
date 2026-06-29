# Wallet Balance Checker

[![CI](https://github.com/akordavid373/wallet-balance-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/akordavid373/wallet-balance-checker/actions/workflows/ci.yml)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://akordavid373.github.io/wallet-balance-checker/)

A **multi-wallet** Stellar dashboard with **Soroban smart contract** integration.
Connect Freighter on Testnet to view XLM balances, send payments, register wallets
on-chain via a deployed Soroban contract, and watch real-time contract events.

**[Live Demo](https://akordavid373.github.io/wallet-balance-checker/)** &mdash; requires Freighter browser extension on Testnet.

## Screenshots

<table>
  <tr>
    <td align="center" width="33%">
      <img src="screenshots/connected.svg" alt="Wallet connected state" width="260">
      <br />
      <em>Wallet connected state &mdash; balance hero card</em>
    </td>
    <td align="center" width="33%">
      <img src="screenshots/balances.svg" alt="Balances displayed" width="260">
      <br />
      <em>All asset balances &mdash; multi-account view</em>
    </td>
    <td align="center" width="33%">
      <img src="screenshots/transaction.svg" alt="Successful transaction" width="260">
      <br />
      <em>Successful testnet transaction &mdash; result feedback</em>
    </td>
  </tr>
</table>

### What you'll see

| Screenshot | Description |
|---|---|
| **Connected state** | Wallet is connected via Freighter on Testnet. The hero card shows the selected account's XLM balance, account label, and network badge. Use the Send XLM button to initiate a payment. |
| **Balances displayed** | The All Assets tab lists every asset held by the connected account (native XLM + issued tokens like USDC) with balances, asset codes, and issuer addresses. The account summary shows totals across all tracked accounts. |
| **Transaction result** | After sending XLM, a green success banner shows the amount and destination, with links to StellarExpert and a Copy Hash button. The hero balance updates immediately and the transaction appears in the History tab. |

## Features

### Level 1
- **Freighter Wallet** &mdash; Connect via Freighter browser extension (Stellar Testnet)
- **Multi-Account Balances** &mdash; Track any Stellar public key (add by key or from Freighter)
- **Send XLM** &mdash; Sign and submit payments through Freighter with real-time feedback
- **Transaction Feedback** &mdash; Success or failure state with transaction hash, amount, destination, and StellarExpert link
- **All Assets** &mdash; View native XLM and issued token balances
- **Account Details** &mdash; Sequence number, signers, thresholds, sub-entries
- **Transaction History** &mdash; Browse recent operations per account
- **Testnet Funding** &mdash; One-click Friendbot funding for new accounts

### Level 2
- **Soroban Smart Contract** &mdash; Deployed `WalletRegistry` contract on Stellar Testnet (`CDUSF32RXYV7VQD272XKF24RCNYFWSV6Y6CGFCLUVDOPRJLI7BOK5G3V`)
- **Contract Calls from Frontend** &mdash; Register/unregister wallets on-chain via Freighter-signed Soroban transactions
- **Real-Time Event Polling** &mdash; Polls Soroban RPC for `register`/`remove` contract events (toggleable live feed)
- **Multi-Wallet Registration** &mdash; Register any Stellar address on the contract with a human-readable label
- **Error Type Handling** (4 types):
  - **Auth errors** &mdash; Freighter rejection / missing authorization
  - **Contract errors** &mdash; AlreadyRegistered, NotRegistered, InvalidLabel, transaction failures
  - **Network errors** &mdash; Horizon/Soroban RPC connectivity issues
  - **RPC errors** &mdash; Transaction timeouts, Soroban RPC unavailability

### Level 3
- **Inter-Contract Communication** &mdash; Vault contract calls WalletRegistry's `is_registered` via `env.invoke_contract()` to authorize withdrawals
- **Mobile Responsive** &mdash; Responsive layout for mobile devices with stacked cards and scrollable tabs
- **E2E Tests** &mdash; Playwright tests for connect screen, prerequisites, and error states
- **CI/CD Pipeline** &mdash; GitHub Actions builds contracts, runs Rust tests, runs Playwright E2E tests, and deploys to GitHub Pages
- **Contract Build Scripts** &mdash; `npm run compile:contracts` compiles all Soroban contracts; `npm run deploy:contracts` compiles & deploys
- **Enhanced Documentation** &mdash; Full demo guide, contract APIs, architecture diagram, and deployment instructions

## Prerequisites

- [Freighter](https://freighter.app/) browser extension
- A Stellar wallet on **Testnet** network
- Node.js 18+
- Rust toolchain (for contract development)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Connect Freighter Wallet**.

### How to use

1. **Connect** &mdash; Click "Connect Freighter Wallet" and approve in the Freighter popup
2. **View balance** &mdash; Your XLM balance appears on the hero card; switch between accounts using the Accounts list
3. **Add accounts** &mdash; Click "+ Add Account" to enter a public key or add from Freighter
4. **Send XLM** &mdash; Click "Send XLM", enter destination and amount, sign with Freighter
5. **Check result** &mdash; A success/failure banner appears with transaction hash, amount, and explorer link
6. **Explore** &mdash; Use the tabs to view all assets, account details, and transaction history
7. **Register on Contract** &mdash; In the Wallet Registry panel, register your wallet with a label (requires Freighter signing)
8. **Watch Events** &mdash; Click "Start Events" to begin polling Soroban RPC for real-time on-chain events

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run compile:contracts` | Compile all Soroban contracts to WASM |
| `npm run deploy:contracts` | Compile and deploy all contracts to Testnet |
| `npm run test:contracts` | Run Rust unit tests for all contracts |
| `npm run test:e2e` | Run Playwright E2E tests |

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

Demonstrates inter-contract communication by calling `WalletRegistry.is_registered` via `env.invoke_contract()`.

| Property | Value |
|---|---|
| Network | Stellar Testnet |
| Source | `contracts/vault/` |

#### Exported Functions

| Function | Args | Returns | Description |
|---|---|---|---|
| `init` | `registry_contract: Address` | `()` | Initialize with WalletRegistry contract address |
| `create_vault` | `owner: Address` | `Result<VaultInfo, VaultError>` | Create a vault (requires registry membership) |
| `deposit` | `owner: Address`, `amount: i128` | `Result<VaultInfo, VaultError>` | Deposit XLM into vault |
| `withdraw` | `owner: Address`, `amount: i128`, `to: Address` | `Result<VaultInfo, VaultError>` | Withdraw XLM (checks registry membership) |
| `get_vault` | `owner: Address` | `Result<VaultInfo, VaultError>` | Get vault info |
| `get_vault_count` | | `u32` | Total vault count |
| `get_registry_address` | | `Address` | Get the registry contract address |

#### Events

| Event | Topics | Payload |
|---|---|---|
| `VaultCreated` | `("VaultCreated", owner)` | `u64` (timestamp) |
| `VaultDeposited` | `("VaultDeposited", owner)` | `i128` (amount) |
| `VaultWithdrawn` | `("VaultWithdrawn", owner, to)` | `i128` (amount) |

#### Errors

| Error | Code | Description |
|---|---|---|
| `NotRegistered` | 1 | Wallet not registered in the WalletRegistry |
| `VaultNotFound` | 2 | No vault exists for the given address |
| `InsufficientBalance` | 3 | Not enough XLM in vault |
| `AlreadyExists` | 4 | Vault already exists for this address |

## Architecture

```
┌───────────────────────┐
│     Freighter API     │
│  (browser extension)  │
└─────────┬─────────────┘
          │ getAddress / signTransaction
          ▼
┌───────────────────────────────────────┐
│      React Frontend                   │
│  ┌─────────┐ ┌────────────────────┐   │
│  │useWallet│ │  useContract       │   │
│  │ hook    │ │  hook              │   │
│  └────┬────┘ │  - prepareTx       │   │
│       │      │  - simulateTx      │   │
│       │      │  - getEvents       │   │
│       │      └────────┬───────────┘   │
│       ▼               ▼               │
│  Horizon REST    Soroban RPC          │
└───────────────────────────────────────┘
          │                     │
          ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ Stellar       │    │ Soroban Contracts│
│ Testnet       │    │ ┌────────────┐   │
│ (Horizon)     │    │ │WalletReg. │   │
│               │    │ │ - register │   │
│               │    │ │ - is_reg. │   │
│               │    │ └─────┬──────┘   │
│               │    │       │invoke    │
│               │    │ ┌─────▼──────┐   │
│               │    │ │Vault      │   │
│               │    │ │ - create  │   │
│               │    │ │ - deposit │   │
│               │    │ │ - withdraw│   │
│               │    │ └───────────┘   │
│               │    └──────────────────┘
└──────────────┘
```

## Tech Stack

| Technology | Purpose |
|---|---|
| **React** | UI framework |
| **TypeScript** | Type safety (strict mode) |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **@stellar/freighter-api** | Wallet connection & transaction signing |
| **@stellar/stellar-sdk** | Transaction building, XDR encoding, Soroban RPC |
| **Horizon API** | On-chain data queries (balances, transactions, account details) |
| **Soroban RPC** | Contract invocation, simulation, event polling |
| **Soroban SDK (Rust)** | Smart contract development (`soroban-sdk` v26) |
| **Playwright** | End-to-end browser testing |

## Project Structure

```
wallet-balance-checker/
├── contracts/
│   ├── wallet-registry/              # Soroban smart contract (Rust)
│   │   └── contracts/wallet-registry/
│   │       └── src/
│   │           ├── lib.rs            # Wallet registry (register, remove, query, events)
│   │           └── test.rs           # 9 unit tests
│   └── vault/                        # Vault contract with inter-contract communication
│       └── contracts/vault/
│           ├── src/
│           │   ├── lib.rs            # Vault (deposit, withdraw, cross-contract calls)
│           │   └── test.rs           # 11 unit tests
│           └── artifacts/            # Compiled WASM binaries
├── e2e/
│   └── dashboard.spec.ts             # Playwright E2E tests
├── src/
│   ├── components/
│   │   ├── WalletDashboard.tsx       # Full UI (multi-account, send, contract panel)
│   │   └── ContractPanel.tsx         # Contract registration UI + event feed
│   ├── hooks/
│   │   ├── useWallet.ts              # Wallet logic (connect, balances, send, multi-account)
│   │   └── useContract.ts            # Contract logic (register, remove, simulate, event polling)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── screenshots/
│   ├── connected.svg
│   ├── balances.svg
│   └── transaction.svg
├── .github/workflows/ci.yml          # CI: contracts build/test, E2E, GitHub Pages deploy
├── playwright.config.ts              # Playwright configuration
└── README.md
```

## How It Works

### Wallet (Level 1)
1. **Connection** &mdash; Uses `@stellar/freighter-api` to detect, connect, and request access from the Freighter browser extension
2. **Network** &mdash; Enforces Stellar Testnet; rejects connections on Mainnet/Futurenet
3. **Balances** &mdash; Fetches account data from Horizon REST API (`https://horizon-testnet.stellar.org`)
4. **Transactions** &mdash; Builds payment operations with `@stellar/stellar-sdk`'s `TransactionBuilder`, signs via Freighter, submits to Horizon
5. **Feedback** &mdash; Parses Horizon response for success/failure, displays hash, amount, destination, and explorer links

### Contract (Level 2)
1. **Deployed Contract** &mdash; `WalletRegistry` Rust smart contract deployed on Testnet via `stellar contract deploy`
2. **Registration** &mdash; Calls `register(wallet, label)` which requires auth from the wallet owner and emits a `WalletRegistered` event
3. **Read-Only Queries** &mdash; Simulates `get_all_wallets()` via Soroban RPC without signing
4. **Event Polling** &mdash; Uses `server.getEvents()` to poll for contract events (configured interval), parsed into the UI feed
5. **Error Handling** &mdash; Categorizes auth, contract, network, and RPC errors with distinct UI styling

### Inter-Contract Communication (Level 3)
1. **Vault Contract** &mdash; Deployed separately; stores vault balances per wallet address
2. **Cross-Contract Call** &mdash; `create_vault` and `withdraw` call `WalletRegistry.is_registered` via `env.invoke_contract()`
3. **Authorization** &mdash; Only wallets registered in the WalletRegistry can create vaults or withdraw funds

## Deployment

### Contracts

Requires the `stellar` CLI and a funded `deployer` identity:

```bash
# Set up deployer identity (one-time)
stellar keys generate deployer
stellar keys fund deployer --network testnet

# Compile all contracts
npm run compile:contracts

# Deploy all contracts
npm run deploy:contracts
```

After deploying, update the contract ID in `src/components/WalletDashboard.tsx`:
```ts
const CONTRACT_ID = 'YOUR_NEW_CONTRACT_ID';
```

### Frontend

GitHub Actions automatically builds and deploys to GitHub Pages on every push to `master`.

## License

MIT
