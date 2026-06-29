import { useState, useCallback, useRef, useEffect } from 'react';
import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Operation,
  Horizon,
} from '@stellar/stellar-sdk';
import { getAddress, signTransaction, isConnected } from '@stellar/freighter-api';

export type ContractErrorType = 'auth' | 'contract' | 'network' | 'rpc' | 'unknown';

export interface ContractError {
  type: ContractErrorType;
  message: string;
  code?: number;
}

export interface RegisteredWallet {
  wallet: string;
  label: string;
  registeredAt: number;
}

export interface ContractEvent {
  id: string;
  type: string;
  wallet: string;
  ledger: number;
  txHash: string;
}

const RPC_URL = 'https://soroban-testnet.stellar.org';

export function useContract(contractId: string) {
  const [registeredWallets, setRegisteredWallets] = useState<RegisteredWallet[]>([]);
  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [contractError, setContractError] = useState<ContractError | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const serverRef = useRef(new rpc.Server(RPC_URL));
  const horizonRef = useRef(new Horizon.Server('https://horizon-testnet.stellar.org'));
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleError = useCallback((err: any): ContractError => {
    if (err?.type === 'auth' || err?.message?.includes('require_auth') || err?.message?.includes('rejected')) {
      return { type: 'auth', message: 'Authentication required. Please approve in Freighter.' };
    }
    if (err?.type === 'network' || err?.message?.includes('fetch') || err?.code === 'NETWORK_ERROR') {
      return { type: 'network', message: 'Network error. Check your connection.' };
    }
    if (err?.type === 'rpc' || err?.message?.includes('timeout')) {
      return { type: 'rpc', message: 'Soroban RPC error. The service may be unavailable.' };
    }
    if (err?.type === 'contract' || err?.code !== undefined) {
      return { type: 'contract', message: `Contract error (code ${err.code || 'unknown'}).`, code: err.code };
    }
    return { type: 'unknown', message: err?.message || 'Unknown error' };
  }, []);

  const buildAndSendContractCall = useCallback(
    async (functionName: string, args: any[], source: string) => {
      const account = await horizonRef.current.loadAccount(source);
      const rawTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
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

      const preparedTx = await serverRef.current.prepareTransaction(rawTx);
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: Networks.TESTNET,
      });

      if (!signedResult.signedTxXdr) {
        throw { message: 'Transaction signing was rejected.', type: 'auth' };
      }

      const signedTx = TransactionBuilder.fromXDR(signedResult.signedTxXdr, Networks.TESTNET);
      const sendResult = await serverRef.current.sendTransaction(signedTx);

      if (sendResult.status === 'ERROR') {
        const code = sendResult.errorResult?.result()?.switch()?.name || 'unknown';
        throw { message: `Transaction failed: ${code}`, type: 'contract' as const, code: sendResult.errorResult?.result()?.value };
      }

      if (sendResult.status === 'PENDING') {
        const hash = sendResult.hash;
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const txResult = await serverRef.current.getTransaction(hash);
          if (txResult.status === 'SUCCESS') return { hash, status: 'SUCCESS' as const };
          if (txResult.status === 'FAILED') throw { message: 'Transaction failed on ledger', type: 'contract' as const };
        }
        throw { message: 'Transaction timed out. Check StellarExpert.', type: 'rpc' as const };
      }

      throw { message: 'Unexpected transaction status', type: 'unknown' as const };
    },
    [contractId],
  );

  const simulateView = useCallback(
    async (functionName: string, args: any[]) => {
      try {
        const connected = await isConnected();
        if (!connected.isConnected) return null;
        const addr = (await getAddress()).address;
        if (!addr) return null;

        const account = await horizonRef.current.loadAccount(addr);
        const tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
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

        const simResult = await serverRef.current.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(simResult)) return null;
        if (!simResult.result?.retval) return null;
        return scValToNative(simResult.result.retval);
      } catch {
        return null;
      }
    },
    [contractId],
  );

  const refreshRegisteredWallets = useCallback(async () => {
    try {
      const result = await simulateView('get_all_wallets', []);
      if (Array.isArray(result)) {
        setRegisteredWallets(
          result.map(([addr, info]: [any, any]) => ({
            wallet: addr?.address?.toString() || addr?.toString() || '',
            label: info?.label?.toString() || '',
            registeredAt: typeof info?.registered_at === 'number' ? info.registered_at : 0,
          })),
        );
      }
    } catch {}
  }, [simulateView]);

  const registerWallet = useCallback(
    async (walletAddress: string, label: string, source: string): Promise<{ hash: string } | ContractError> => {
      setIsContractLoading(true);
      setContractError(null);
      try {
        const result = await buildAndSendContractCall(
          'register',
          [nativeToScVal(walletAddress, { type: 'address' }), nativeToScVal(label, { type: 'string' })],
          source,
        );
        await refreshRegisteredWallets();
        return { hash: result.hash };
      } catch (err: any) {
        const errObj = handleError(err);
        setContractError(errObj);
        return errObj;
      } finally {
        setIsContractLoading(false);
      }
    },
    [buildAndSendContractCall, handleError, refreshRegisteredWallets],
  );

  const removeRegisteredWallet = useCallback(
    async (walletAddress: string, source: string): Promise<{ hash: string } | ContractError> => {
      setIsContractLoading(true);
      setContractError(null);
      try {
        const result = await buildAndSendContractCall(
          'remove_wallet',
          [nativeToScVal(walletAddress, { type: 'address' })],
          source,
        );
        await refreshRegisteredWallets();
        return { hash: result.hash };
      } catch (err: any) {
        const errObj = handleError(err);
        setContractError(errObj);
        return errObj;
      } finally {
        setIsContractLoading(false);
      }
    },
    [buildAndSendContractCall, handleError, refreshRegisteredWallets],
  );

  const fetchEvents = useCallback(async (startLedger?: number) => {
    try {
      const result = await serverRef.current.getEvents({
        startLedger: startLedger || 0,
        filters: [{ contractIds: [contractId] }],
        limit: 50,
      });
      const parsed: ContractEvent[] = (result.events || []).map((e) => {
        const topic0 = e.topic?.[0];
        const topicStr = topic0 ? (scValToNative(topic0)?.toString() || '') : '';
        let walletStr = '';
        try {
          const data = scValToNative(e.value);
          if (data && typeof data === 'object') {
            walletStr = (data as any).wallet?.toString() || (data as any).to?.toString() || '';
          }
        } catch {}
        return {
          id: e.id,
          type: topicStr,
          wallet: walletStr,
          ledger: e.ledger,
          txHash: e.txHash,
        };
      });
      setContractEvents(parsed);
    } catch {}
  }, [contractId]);

  const startPolling = useCallback(
    (intervalMs = 15000) => {
      if (pollIntervalRef.current) return;
      setIsPolling(true);
      fetchEvents();
      pollIntervalRef.current = setInterval(() => fetchEvents(), intervalMs);
    },
    [fetchEvents],
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const clearContractError = useCallback(() => setContractError(null), []);

  return {
    registeredWallets,
    contractEvents,
    isContractLoading,
    contractError,
    isPolling,
    registerWallet,
    removeWallet: removeRegisteredWallet,
    refreshRegisteredWallets,
    fetchEvents,
    startPolling,
    stopPolling,
    clearContractError,
  };
}
