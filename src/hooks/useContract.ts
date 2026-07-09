import { useState, useCallback, useRef, useEffect } from 'react';
import { nativeToScVal } from '@stellar/stellar-sdk';
import { POLLING_INTERVAL } from '../config';
import { buildAndSendContractCall, simulateView, fetchContractEvents } from '../utils/services';
import { classifyError } from '../utils/helpers';

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

export function useContract(contractId: string) {
  const [registeredWallets, setRegisteredWallets] = useState<RegisteredWallet[]>([]);
  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [contractError, setContractError] = useState<ContractError | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastEventLedger, setLastEventLedger] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);

  const handleError = useCallback((err: any): ContractError => {
    const appErr = classifyError(err);
    return { type: appErr.type, message: appErr.message, code: appErr.code };
  }, []);

  const refreshRegisteredWallets = useCallback(async () => {
    try {
      const result = await simulateView(contractId, 'get_all_wallets', []);
      if (Array.isArray(result)) {
        setRegisteredWallets(
          result.map(([addr, info]: [any, any]) => ({
            wallet: addr?.address?.toString() || addr?.toString() || '',
            label: info?.label?.toString() || '',
            registeredAt: typeof info?.registered_at === 'number' ? info.registered_at : 0,
          })),
        );
      }
    } catch {
      // silent - simulation errors are non-critical
    }
  }, [contractId]);

  const registerWallet = useCallback(
    async (walletAddress: string, label: string, source: string): Promise<{ hash: string } | ContractError> => {
      setIsContractLoading(true);
      setContractError(null);
      try {
        const result = await buildAndSendContractCall(
          contractId,
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
    [contractId, handleError, refreshRegisteredWallets],
  );

  const removeRegisteredWallet = useCallback(
    async (walletAddress: string, source: string): Promise<{ hash: string } | ContractError> => {
      setIsContractLoading(true);
      setContractError(null);
      try {
        const result = await buildAndSendContractCall(
          contractId,
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
    [contractId, handleError, refreshRegisteredWallets],
  );

  const fetchEvents = useCallback(async (startLedger?: number) => {
    try {
      const events = await fetchContractEvents(contractId, startLedger);
      if (events.length > 0) {
        setContractEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = events.filter((e) => !existingIds.has(e.id));
          const merged = [...newEvents, ...prev].slice(0, 50);
          return merged;
        });
        const maxLedger = Math.max(...events.map((e) => e.ledger));
        if (maxLedger > 0) setLastEventLedger(maxLedger);
        setEventsCount((c) => c + events.length);
        reconnectAttempts.current = 0;
      }
    } catch {
      reconnectAttempts.current++;
    }
  }, [contractId]);

  const startPolling = useCallback(
    (intervalMs = POLLING_INTERVAL) => {
      if (pollIntervalRef.current) return;
      setIsPolling(true);
      setEventsCount(0);
      fetchEvents();
      pollIntervalRef.current = setInterval(() => {
        fetchEvents(lastEventLedger > 0 ? lastEventLedger + 1 : undefined);
      }, intervalMs);
    },
    [fetchEvents, lastEventLedger],
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  const restartPolling = useCallback(() => {
    stopPolling();
    setTimeout(() => startPolling(), 1000);
  }, [startPolling, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const clearContractError = useCallback(() => setContractError(null), []);

  const hasNewEvents = eventsCount > 0;

  return {
    registeredWallets,
    contractEvents,
    isContractLoading,
    contractError,
    isPolling,
    hasNewEvents,
    eventsCount,
    registerWallet,
    removeWallet: removeRegisteredWallet,
    refreshRegisteredWallets,
    fetchEvents,
    startPolling,
    stopPolling,
    restartPolling,
    clearContractError,
  };
}