import { useState } from 'react';
import type { VaultInfo } from '../hooks/useVault';
import { shortKey } from '../utils/helpers';

function VaultInfoDisplay({ vault }: { vault: VaultInfo }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
        <span className="text-sm text-gray-600">Owner</span>
        <span className="text-sm font-mono text-gray-900">{shortKey(vault.owner, 6)}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
        <span className="text-sm text-gray-600">Balance</span>
        <span className="text-sm font-bold text-gray-900">{vault.balance}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
        <span className="text-sm text-gray-600">Created</span>
        <span className="text-sm text-gray-900">{new Date(vault.created_at * 1000).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function VaultPanel({
  vault,
  vaultCount,
  vaultError,
  isVaultLoading,
  registryAddress,
  onCreateVault,
  onDeposit,
  onWithdraw,
  onRefreshVault,
  onDismissVaultError,
}: {
  vault: VaultInfo | null;
  vaultCount: number;
  vaultError: string | null;
  isVaultLoading: boolean;
  registryAddress: string;
  onCreateVault: () => void;
  onDeposit: (amount: string) => void;
  onWithdraw: (amount: string, to: string) => void;
  onRefreshVault: () => void;
  onDismissVaultError: () => void;
}) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTo, setWithdrawTo] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vault (Inter-Contract Demo)</h3>
        </div>
        <button
          onClick={onRefreshVault}
          disabled={isVaultLoading}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
        >
          {isVaultLoading ? '\u23F3' : '\u21BB'}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {vaultError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start justify-between">
            <span>{vaultError}</span>
            <button onClick={onDismissVaultError} className="ml-2">&times;</button>
          </div>
        )}

        {registryAddress && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Registry Contract: </span>
            <span className="font-mono text-gray-700">{shortKey(registryAddress, 8)}</span>
          </div>
        )}

        {isVaultLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : vault ? (
          <VaultInfoDisplay vault={vault} />
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-4">No vault found for this account. Create one to get started.</p>
            <button
              onClick={onCreateVault}
              disabled={isVaultLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              Create Vault
            </button>
          </div>
        )}

        {vault && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Vault Count: <strong>{vaultCount}</strong></span>
            </div>

            {!showDeposit && !showWithdraw && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeposit(true)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Deposit
                </button>
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                >
                  Withdraw
                </button>
              </div>
            )}

            {showDeposit && (
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-sm font-medium text-gray-700">Deposit</p>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (depositAmount) {
                        onDeposit(depositAmount);
                        setDepositAmount('');
                        setShowDeposit(false);
                      }
                    }}
                    disabled={isVaultLoading || !depositAmount}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirm Deposit
                  </button>
                  <button onClick={() => setShowDeposit(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {showWithdraw && (
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-sm font-medium text-gray-700">Withdraw</p>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  value={withdrawTo}
                  onChange={(e) => setWithdrawTo(e.target.value)}
                  placeholder="Destination address (G...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (withdrawAmount && withdrawTo) {
                        onWithdraw(withdrawAmount, withdrawTo);
                        setWithdrawAmount('');
                        setWithdrawTo('');
                        setShowWithdraw(false);
                      }
                    }}
                    disabled={isVaultLoading || !withdrawAmount || !withdrawTo}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                  >
                    Confirm Withdraw
                  </button>
                  <button onClick={() => setShowWithdraw(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}