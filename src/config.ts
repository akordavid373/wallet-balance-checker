export const config = {
  horizonUrl: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  friendbotUrl: import.meta.env.VITE_FRIENDBOT_URL || 'https://friendbot.stellar.org',
  walletRegistryId: import.meta.env.VITE_WALLET_REGISTRY_ID || 'CDUSF32RXYV7VQD272XKF24RCNYFWSV6Y6CGFCLUVDOPRJLI7BOK5G3V',
  vaultContractId: import.meta.env.VITE_VAULT_CONTRACT_ID || '',
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  appName: import.meta.env.VITE_APP_NAME || 'Wallet Balance Checker',
  stellarExpertUrl: import.meta.env.VITE_STELLAR_EXPERT_URL || 'https://stellar.expert/explorer/testnet',
};

export const POLLING_INTERVAL = 15000;
export const TX_TIMEOUT_SECONDS = 30;
export const MAX_EVENTS_DISPLAY = 20;
export const MAX_TX_HISTORY = 20;