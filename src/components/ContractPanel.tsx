import { useState } from 'react';
import type { RegisteredWallet, ContractEvent, ContractError } from '../hooks/useContract';
import { shortKey } from '../utils/helpers';
import { toast } from './Toast';

function ContractErrorBanner({
  error,
  onDismiss,
}: {
  error: ContractError | null;
  onDismiss: () => void;
}) {
  if (!error) return null;
  const colors: Record<string, string> = {
    auth: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    contract: 'border-red-200 bg-red-50 text-red-800',
    network: 'border-orange-200 bg-orange-50 text-orange-800',
    rpc: 'border-purple-200 bg-purple-50 text-purple-800',
    unknown: 'border-gray-200 bg-gray-50 text-gray-800',
  };
  return (
    <div className={`rounded-lg border p-3 text-sm ${colors[error.type] || colors.unknown}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize">{error.type}</span>
          <span>{error.message}</span>
        </div>
        <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">&times;</button>
      </div>
    </div>
  );
}

function ContractEventFeed({ events }: { events: ContractEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No contract events yet</p>;
  }
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {events.slice(0, 20).map((e, i) => (
        <div key={e.id || i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${e.type.includes('reg') || e.type.includes('osit') ? 'bg-green-400' : e.type.includes('ith') ? 'bg-orange-400' : 'bg-red-400'}`} />
            <span className="text-gray-500 text-xs font-mono truncate">{e.type}</span>
            <span className="font-mono text-xs text-gray-400 truncate">{shortKey(e.wallet, 6)}</span>
          </div>
          <span className="text-xs text-gray-400 shrink-0">#{e.ledger}</span>
        </div>
      ))}
    </div>
  );
}

export default function ContractPanel({
  registeredWallets,
  contractEvents,
  contractError,
  isContractLoading,
  isPolling,
  hasNewEvents,
  eventsCount,
  selectedPublicKey,
  onRegister,
  onRemove,
  onRefresh,
  onStartPolling,
  onStopPolling,
  onRestartPolling,
  onDismissError,
}: {
  registeredWallets: RegisteredWallet[];
  contractEvents: ContractEvent[];
  contractError: ContractError | null;
  isContractLoading: boolean;
  isPolling: boolean;
  hasNewEvents?: boolean;
  eventsCount?: number;
  selectedPublicKey: string;
  onRegister: (wallet: string, label: string) => void;
  onRemove: (wallet: string) => void;
  onRefresh: () => void;
  onStartPolling: () => void;
  onStopPolling: () => void;
  onRestartPolling?: () => void;
  onDismissError: () => void;
}) {
  const [label, setLabel] = useState('');
  const [showForm, setShowForm] = useState(false);

  const isRegistered = registeredWallets.some(
    (w) => w.wallet.toLowerCase() === selectedPublicKey?.toLowerCase(),
  );
  const currentWallet = registeredWallets.find(
    (w) => w.wallet.toLowerCase() === selectedPublicKey?.toLowerCase(),
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Wallet Registry</h3>
          {isPolling && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isPolling ? (
            <button
              onClick={onStartPolling}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
            >
              Start Events
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={onStopPolling}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
              >
                Stop
              </button>
              <button
                onClick={onRestartPolling}
                className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                title="Restart polling"
              >
                &#x21BB;
              </button>
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isContractLoading}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
          >
            {isContractLoading ? '\u23F3' : '\u21BB'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <ContractErrorBanner error={contractError} onDismiss={onDismissError} />

        {selectedPublicKey && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isRegistered ? 'Registered on contract' : 'Not registered'}
              </p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{shortKey(selectedPublicKey, 12)}</p>
            </div>
            {isRegistered ? (
              <button
                onClick={() => onRemove(selectedPublicKey)}
                disabled={isContractLoading}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {isContractLoading ? 'Removing...' : 'Unregister'}
              </button>
            ) : (
              !showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
                >
                  Register
                </button>
              ) : null
            )}
          </div>
        )}

        {showForm && !isRegistered && (
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <p className="text-sm text-gray-600">Register your wallet on the Soroban contract</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g., My Wallet)"
                className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && label) {
                    onRegister(selectedPublicKey, label);
                    setLabel('');
                    setShowForm(false);
                    toast('Registration submitted', 'info');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (label) {
                    onRegister(selectedPublicKey, label);
                    setLabel('');
                    setShowForm(false);
                    toast('Registration submitted', 'info');
                  }
                }}
                disabled={isContractLoading || !label}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {isContractLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        )}

        {currentWallet && (
          <div className="text-sm text-gray-600">
            Label: <span className="font-medium text-gray-900">{currentWallet.label}</span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Registered Wallets ({registeredWallets.length})
            </h4>
            {hasNewEvents && eventsCount && eventsCount > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {eventsCount} new event{eventsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {registeredWallets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No wallets registered yet</p>
          ) : (
            <div className="space-y-2">
              {registeredWallets.map((w) => (
                <div
                  key={w.wallet}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{w.label}</p>
                    <p className="text-xs font-mono text-gray-500 truncate">{shortKey(w.wallet, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Recent Events ({contractEvents.length})
          </h4>
          <ContractEventFeed events={contractEvents} />
        </div>
      </div>
    </div>
  );
}