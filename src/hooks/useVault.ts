import { useState, useCallback } from 'react';
import { nativeToScVal } from '@stellar/stellar-sdk';
import { buildAndSendContractCall, simulateView } from '../utils/services';
import { classifyError } from '../utils/helpers';

export interface VaultInfo {
  owner: string;
  balance: number;
  created_at: number;
}

export function useVault(contractId: string, _registryContractId = '') {
  void _registryContractId;
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [vaultCount, setVaultCount] = useState(0);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [registryAddress, setRegistryAddress] = useState('');

  const fetchVault = useCallback(async (ownerAddress: string) => {
    if (!contractId) return;
    setIsVaultLoading(true);
    setVaultError(null);
    try {
      const result = await simulateView(contractId, 'get_vault', [
        nativeToScVal(ownerAddress, { type: 'address' }),
      ]);
      if (result && typeof result === 'object') {
        setVault({
          owner: (result as any).owner?.toString?.() || (result as any).owner || '',
          balance: typeof (result as any).balance === 'number' ? (result as any).balance : 0,
          created_at: typeof (result as any).created_at === 'number' ? (result as any).created_at : 0,
        });
      } else {
        setVault(null);
      }
    } catch {
      setVault(null);
    } finally {
      setIsVaultLoading(false);
    }
  }, [contractId]);

  const fetchVaultCount = useCallback(async () => {
    if (!contractId) return;
    try {
      const count = await simulateView(contractId, 'get_vault_count', []);
      if (typeof count === 'number') setVaultCount(count);
    } catch {
      // silent - view function may fail if not deployed
    }
  }, [contractId]);

  const fetchRegistryAddress = useCallback(async () => {
    if (!contractId) return;
    try {
      const addr = await simulateView(contractId, 'get_registry_address', []);
      if (addr && typeof addr === 'object') {
        setRegistryAddress((addr as any).toString?.() || '');
      }
    } catch {
      // silent - view function may fail if not deployed
    }
  }, [contractId]);

  const createVault = useCallback(async (ownerPublicKey: string) => {
    if (!contractId) {
      setVaultError('Vault contract not deployed. Set VITE_VAULT_CONTRACT_ID in .env');
      return;
    }
    setIsVaultLoading(true);
    setVaultError(null);
    try {
      await buildAndSendContractCall(contractId, 'create_vault', [
        nativeToScVal(ownerPublicKey, { type: 'address' }),
      ], ownerPublicKey);
      await fetchVault(ownerPublicKey);
      await fetchVaultCount();
    } catch (err: any) {
      const appErr = classifyError(err);
      setVaultError(appErr.message);
    } finally {
      setIsVaultLoading(false);
    }
  }, [contractId, fetchVault, fetchVaultCount]);

  const deposit = useCallback(async (ownerPublicKey: string, amount: string) => {
    if (!contractId) return;
    setIsVaultLoading(true);
    setVaultError(null);
    try {
      await buildAndSendContractCall(contractId, 'deposit', [
        nativeToScVal(ownerPublicKey, { type: 'address' }),
        nativeToScVal(parseInt(amount, 10), { type: 'i128' }),
      ], ownerPublicKey);
      await fetchVault(ownerPublicKey);
    } catch (err: any) {
      const appErr = classifyError(err);
      setVaultError(appErr.message);
    } finally {
      setIsVaultLoading(false);
    }
  }, [contractId, fetchVault]);

  const withdraw = useCallback(async (ownerPublicKey: string, amount: string, to: string) => {
    if (!contractId) return;
    setIsVaultLoading(true);
    setVaultError(null);
    try {
      await buildAndSendContractCall(contractId, 'withdraw', [
        nativeToScVal(ownerPublicKey, { type: 'address' }),
        nativeToScVal(parseInt(amount, 10), { type: 'i128' }),
        nativeToScVal(to, { type: 'address' }),
      ], ownerPublicKey);
      await fetchVault(ownerPublicKey);
    } catch (err: any) {
      const appErr = classifyError(err);
      setVaultError(appErr.message);
    } finally {
      setIsVaultLoading(false);
    }
  }, [contractId, fetchVault]);

  return {
    vault,
    vaultCount,
    vaultError,
    isVaultLoading,
    registryAddress,
    fetchVault,
    fetchVaultCount,
    fetchRegistryAddress,
    createVault,
    deposit,
    withdraw,
    clearVaultError: () => setVaultError(null),
  };
}