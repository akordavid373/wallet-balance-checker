#!/usr/bin/env bash
set -euo pipefail

echo "=== Soroban Contract Deployment ==="

# Check for stellar CLI
if ! command -v stellar &> /dev/null; then
  echo "Error: 'stellar' CLI not found. Install it from https://github.com/stellar/stellar-cli"
  exit 1
fi

DEPLOYER="${DEPLOYER:-deployer}"
NETWORK="${NETWORK:-testnet}"

echo "Deployer: $DEPLOYER"
echo "Network: $NETWORK"
echo ""

# Compile
echo "=== Compiling contracts ==="
cargo build --target wasm32v1-none --release \
  --manifest-path contracts/wallet-registry/contracts/wallet-registry/Cargo.toml
cargo build --target wasm32v1-none --release \
  --manifest-path contracts/vault/contracts/vault/Cargo.toml

REGISTRY_WASM="contracts/wallet-registry/target/wasm32v1-none/release/wallet_registry.wasm"
VAULT_WASM="contracts/vault/target/wasm32v1-none/release/vault.wasm"

mkdir -p contracts/artifacts
cp "$REGISTRY_WASM" contracts/artifacts/
cp "$VAULT_WASM" contracts/artifacts/
echo "WASM artifacts copied to contracts/artifacts/"
echo ""

# Deploy WalletRegistry
echo "=== Deploying WalletRegistry ==="
REGISTRY_ID=$(stellar contract deploy \
  --wasm "$REGISTRY_WASM" \
  --source-account "$DEPLOYER" \
  --network "$NETWORK" \
  2>&1 | tail -1)
echo "WalletRegistry deployed: $REGISTRY_ID"

# Deploy Vault
echo "=== Deploying Vault ==="
VAULT_ID=$(stellar contract deploy \
  --wasm "$VAULT_WASM" \
  --source-account "$DEPLOYER" \
  --network "$NETWORK" \
  2>&1 | tail -1)
echo "Vault deployed: $VAULT_ID"

# Initialize Vault with WalletRegistry address
echo ""
echo "=== Initializing Vault with WalletRegistry ==="
stellar contract invoke \
  --id "$VAULT_ID" \
  --source-account "$DEPLOYER" \
  --network "$NETWORK" \
  -- \
  init \
  --registry_contract "$REGISTRY_ID"

echo ""
echo "=== Deployment Summary ==="
echo "WalletRegistry: $REGISTRY_ID"
echo "Vault:          $VAULT_ID"
echo ""
echo "Update these values in your .env:"
echo "VITE_WALLET_REGISTRY_ID=$REGISTRY_ID"
echo "VITE_VAULT_CONTRACT_ID=$VAULT_ID"
echo ""
echo "=== Running verification ==="
node scripts/deploy-verify.js "$REGISTRY_ID"
echo "Done!"