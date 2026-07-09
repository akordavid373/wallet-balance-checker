import { useState, useEffect, useCallback } from 'react';
import { isConnected, requestAccess, getAddress, getNetwork } from '@stellar/freighter-api';
import { Networks } from '@stellar/stellar-sdk';
import { config } from '../config';
import {
  fetchBalance,
  fetchAccountDetails,
  fetchTransactionHistory,
  sendXLM,
} from '../utils/services';
import { AppError } from '../utils/helpers';

export type { AssetBalance, AccountDetails, TransactionRecord } from '../utils/services';
export interface WalletAccount {
  publicKey: string;
  network: string;
  balance: string;
  label?: string;
}

export function useWallet() {
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const connectedResult = await isConnected();
      if (!connectedResult.isConnected) {
        const accessResult = await requestAccess();
        if (!accessResult.address) {
          throw new AppError('Freighter access denied. Please approve the connection request.', 'auth');
        }
      }

      const addressResult = await getAddress();
      if (!addressResult.address) {
        throw new AppError('Could not retrieve wallet address from Freighter.', 'auth');
      }

      const networkResult = await getNetwork();
      if (networkResult.networkPassphrase !== Networks.TESTNET) {
        throw new AppError('Please switch your Freighter wallet to Testnet.', 'auth');
      }

      const balance = await fetchBalance(addressResult.address);
      const account: WalletAccount = {
        publicKey: addressResult.address,
        network: 'testnet',
        balance,
        label: 'Account 1',
      };

      setAccounts([account]);
      setSelectedAccount(account);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
    setError(null);
  }, []);

  const selectAccount = useCallback(
    (publicKey: string) => {
      const account = accounts.find((a) => a.publicKey === publicKey);
      if (account) setSelectedAccount(account);
    },
    [accounts],
  );

  const refreshBalances = useCallback(async () => {
    const updated = await Promise.all(
      accounts.map(async (acc) => ({
        ...acc,
        balance: await fetchBalance(acc.publicKey),
      })),
    );
    setAccounts(updated);
    if (selectedAccount) {
      const found = updated.find((a) => a.publicKey === selectedAccount.publicKey);
      if (found) setSelectedAccount(found);
    }
  }, [accounts, selectedAccount]);

  const addAccount = useCallback(
    async (publicKey?: string) => {
      setError(null);
      try {
        let key = publicKey;

        if (!key) {
          const connectedResult = await isConnected();
          if (!connectedResult.isConnected) await requestAccess();
          const addressResult = await getAddress();
          if (!addressResult.address) throw new AppError('Could not retrieve wallet address.', 'auth');
          key = addressResult.address;
        }

        if (accounts.some((a) => a.publicKey === key)) {
          throw new AppError('This account is already added');
        }

        const balance = await fetchBalance(key);
        const newAccount: WalletAccount = {
          publicKey: key,
          network: 'testnet',
          balance,
          label: `Account ${accounts.length + 1}`,
        };
        const updated = [...accounts, newAccount];
        setAccounts(updated);
        setSelectedAccount(newAccount);
      } catch (err: any) {
        setError(err.message || 'Failed to add account');
      }
    },
    [accounts],
  );

  const removeAccount = useCallback(
    (publicKey: string) => {
      if (accounts.length <= 1) return;
      const updated = accounts.filter((a) => a.publicKey !== publicKey);
      setAccounts(updated);
      if (selectedAccount?.publicKey === publicKey) {
        setSelectedAccount(updated[0] || null);
      }
    },
    [accounts, selectedAccount],
  );

  const fundWithFriendbot = useCallback(
    async (publicKey?: string): Promise<string> => {
      const key = publicKey || selectedAccount?.publicKey;
      if (!key) throw new AppError('No account selected');

      const res = await fetch(`${config.friendbotUrl}?addr=${encodeURIComponent(key)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new AppError(err.detail || 'Friendbot funding failed', 'network');
      }
      const data = await res.json();
      await refreshBalances();
      return data.hash || 'Account funded with 10,000 XLM';
    },
    [selectedAccount, refreshBalances],
  );

  const handleSendXLM = useCallback(
    async (destination: string, amount: string) => {
      if (!selectedAccount) {
        return { hash: '', status: 'failed' as const, message: 'No wallet connected' };
      }

      try {
        const result = await sendXLM(destination, amount, selectedAccount.publicKey);
        if (result.status === 'success') {
          await refreshBalances();
        }
        return result;
      } catch (err: any) {
        return { hash: '', status: 'failed' as const, message: err.message || 'Transaction failed' };
      }
    },
    [selectedAccount, refreshBalances],
  );

  useEffect(() => {
    const init = async () => {
      try {
        if ((await isConnected()).isConnected) {
          await connect();
        }
      } catch {
        // silent - auto-connect is best-effort
      }
    };
    init();
  }, [connect]);

  return {
    accounts,
    selectedAccount,
    isConnecting,
    isConnected: accounts.length > 0,
    error,
    connect,
    disconnect,
    selectAccount,
    refreshBalances,
    sendXLM: handleSendXLM,
    addAccount,
    removeAccount,
    fundWithFriendbot,
    fetchAccountDetails,
    fetchTransactionHistory,
  };
}