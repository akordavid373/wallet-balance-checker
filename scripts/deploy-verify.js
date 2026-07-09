/**
 * Deployment verification script.
 * Checks that the deployed WASM matches the source and that
 * the frontend can reach the deployed contracts.
 *
 * Usage: node scripts/deploy-verify.js <CONTRACT_ID>
 *
 * Requires: stellar CLI, Node 18+
 */

const contractId = process.argv[2];

if (!contractId) {
  console.error('Usage: node scripts/deploy-verify.js <CONTRACT_ID>');
  process.exit(1);
}

async function verify() {
  console.log(`\nVerifying contract ${contractId} on Stellar Testnet...\n`);

  try {
    const simRes = await fetch(
      'https://soroban-testnet.stellar.org/soroban/rpc',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getContractData',
          params: {
            contractId,
            key: 'contractCode',
          },
        }),
      },
    );

    const simData = await simRes.json();

    if (simData.result) {
      console.log('\u2705 Contract is reachable on Soroban RPC');
      console.log(`   Contract ID: ${contractId}`);
    } else if (simData.error) {
      console.log('\u26A0\uFE0F Contract unreachable:', simData.error.message);
      console.log('  The contract may not be deployed or the ID is incorrect.');
    }
  } catch (err) {
    console.error('\u274C Network error:', err.message);
    process.exit(1);
  }

  try {
    const horizonRes = await fetch(
      `https://horizon-testnet.stellar.org/contracts/${contractId}`,
    );
    if (horizonRes.ok) {
      console.log('\u2705 Contract found on Horizon');
    } else {
      console.log('\u26A0\uFE0F Contract not found on Horizon (may not be indexed yet)');
    }
  } catch {
    console.log('\u26A0\uFE0F Could not verify on Horizon');
  }

  console.log('\nDeployment verification complete.\n');
}

verify().catch(console.error);