import {
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  Operation,
  Horizon,
  rpc,
} from '@stellar/stellar-sdk';
import { isConnected, getAddress, requestAccess, signTransaction } from '@stellar/freighter-api';
import { config } from '../config';
import { AppError } from './helpers';

export interface AssetBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
}

export interface AccountDetails {
  sequence: string;
  balances: AssetBalance[];
  signers: { key: string; type: string; weight: number }[];
  thresholds: { low_threshold: number; med_threshold: number; high_threshold: number };
  subentry_count: number;
  home_domain?: string;
  last_modified_ledger: number;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  operation_type: string;
  amount?: string;
  asset_code?: string;
  from?: string;
  to?: string;
  successful: boolean;
}

let server: Horizon.Server;
let sorobanServer: rpc.Server;

export function getServer(): Horizon.Server {
  if (!server) server = new Horizon.Server(config.horizonUrl);
  return server;
}

export function getSorobanServer(): rpc.Server {
  if (!sorobanServer) sorobanServer = new rpc.Server(config.sorobanRpcUrl);
  return sorobanServer;
}

export async function ensureConnected(): Promise<string> {
  const connected = await isConnected();
  if (!connected.isConnected) {
    const { address } = await requestAccess();
    if (!address) throw new AppError('Freighter access denied.', 'auth');
  }
  const { address } = await getAddress();
  if (!address) throw new AppError('No address found.', 'auth');
  return address;
}

export async function fetchBalance(publicKey: string): Promise<string> {
  try {
    const res = await fetch(`${config.horizonUrl}/accounts/${publicKey}`);
    if (!res.ok) return '0.0000000';
    const data = await res.json();
    const native = data.balances?.find((b: any) => b.asset_type === 'native');
    return native ? native.balance : '0.0000000';
  } catch {
    return '0.0000000';
  }
}

export async function fetchAccountDetails(publicKey: string) {
  const res = await fetch(`${config.horizonUrl}/accounts/${publicKey}`);
  if (!res.ok) throw new AppError('Failed to fetch account details', 'network');
  const data = await res.json();
  return {
    sequence: data.sequence,
    balances: data.balances || [],
    signers: data.signers || [],
    thresholds: data.thresholds || { low_threshold: 0, med_threshold: 0, high_threshold: 0 },
    subentry_count: data.subentry_count || 0,
    home_domain: data.home_domain,
    last_modified_ledger: data.last_modified_ledger,
  };
}

export async function fetchTransactionHistory(publicKey: string, limit = 20) {
  const opsRes = await fetch(
    `${config.horizonUrl}/accounts/${publicKey}/operations?limit=${limit}&order=desc`,
  );
  if (!opsRes.ok) return [];
  const opsData = await opsRes.json();
  return (opsData._embedded?.records || []).map((op: any) => ({
    id: op.id,
    hash: op.transaction_hash,
    created_at: op.created_at,
    source_account: op.source_account || publicKey,
    operation_type: op.type,
    amount: op.amount,
    asset_code: op.asset_code,
    from: op.from,
    to: op.to,
    successful: op.transaction_successful !== false,
  }));
}

export async function sendXLM(destination: string, amount: string, sourcePublicKey: string) {
  const server = getServer();
  const account = await server.loadAccount(sourcePublicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(Operation.payment({ destination, asset: Asset.native(), amount }))
    .setTimeout(30)
    .build();

  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase: config.networkPassphrase,
  });

  if (!signed.signedTxXdr) {
    return { hash: '', status: 'failed' as const, message: 'Transaction signing was rejected.' };
  }

  const submitRes = await fetch(`${config.horizonUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(signed.signedTxXdr)}`,
  });

  if (!submitRes.ok) {
    const errBody = await submitRes.json();
    return {
      hash: '',
      status: 'failed' as const,
      message: errBody?.extras?.result_codes?.transaction || 'Transaction submission failed',
    };
  }

  const submitData = await submitRes.json();
  return { hash: submitData.hash, status: 'success' as const, message: submitData.hash, amount, destination };
}

import { Asset } from '@stellar/stellar-sdk';

export async function buildAndSendContractCall(
  contractId: string,
  functionName: string,
  args: any[],
  source: string,
) {
  const server = getServer();
  const soroban = getSorobanServer();

  const account = await server.loadAccount(source);
  const rawTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: functionName,
        args,
      }),
    )
    .setTimeout(30)
    .build();

  const preparedTx = await soroban.prepareTransaction(rawTx);
  const signedResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: config.networkPassphrase,
  });

  if (!signedResult.signedTxXdr) {
    throw new AppError('Transaction signing was rejected.', 'auth');
  }

  const signedTx = TransactionBuilder.fromXDR(signedResult.signedTxXdr, config.networkPassphrase);
  const sendResult = await soroban.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    const code = sendResult.errorResult?.result()?.switch()?.name || 'unknown';
    throw new AppError(`Contract call failed: ${code}`, 'contract');
  }

  if (sendResult.status === 'PENDING') {
    const hash = sendResult.hash;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const txResult = await soroban.getTransaction(hash);
      if (txResult.status === 'SUCCESS') return { hash, status: 'SUCCESS' as const };
      if (txResult.status === 'FAILED') throw new AppError('Transaction failed on ledger', 'contract');
    }
    throw new AppError('Transaction timed out.', 'rpc');
  }

  throw new AppError('Unexpected transaction status', 'unknown');
}

export async function simulateView(contractId: string, functionName: string, args: any[]) {
  try {
    const address = await ensureConnected();
    const soroban = getSorobanServer();
    const horizon = getServer();

    const account = await horizon.loadAccount(address);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: functionName,
          args,
        }),
      )
      .setTimeout(30)
      .build();

    const simResult = await soroban.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) return null;
    if (!simResult.result?.retval) return null;
    return scValToNative(simResult.result.retval);
  } catch {
    return null;
  }
}

export async function fetchContractEvents(contractId: string, startLedger?: number) {
  const soroban = getSorobanServer();
  const result = await soroban.getEvents({
    startLedger: startLedger || 0,
    filters: [{ contractIds: [contractId] }],
    limit: 50,
  });
  return (result.events || []).map((e) => {
    const topic0 = e.topic?.[0];
    const topicStr = topic0 ? (scValToNative(topic0)?.toString() || '') : '';
    let walletStr = '';
    try {
      const data = scValToNative(e.value);
      if (data && typeof data === 'object') {
        walletStr = (data as any).wallet?.toString() || (data as any).to?.toString() || (data as any).owner?.toString() || '';
      }
    } catch {
      // silent - event data parsing may fail for some formats
    }
    return { id: e.id, type: topicStr, wallet: walletStr, ledger: e.ledger, txHash: e.txHash };
  });
}