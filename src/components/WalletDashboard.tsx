import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import type { WalletAccount, AccountDetails, TransactionRecord, AssetBalance } from '../hooks/useWallet';

/* ───────── helpers ───────── */

function shortKey(k: string, n = 8) {
  return `${k.slice(0, n)}\u2026${k.slice(-n)}`;
}

function fmtBalance(b: string) {
  return parseFloat(b).toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 7,
  });
}

/* ───────── BalanceCard ───────── */

function BalanceCard({
  account,
  isSelected,
  onSelect,
  onRemove,
  canRemove,
}: {
  account: WalletAccount;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{account.label}</span>
        <div className="flex items-center gap-2">
          {isSelected && (
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-gray-300 hover:text-red-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">
        {fmtBalance(account.balance)} <span className="text-sm font-normal text-gray-500">XLM</span>
      </p>
      <p className="text-xs font-mono text-gray-500 mt-1 truncate">{shortKey(account.publicKey)}</p>
    </div>
  );
}

/* ───────── TransactionFeedback ───────── */

function TransactionFeedback({
  result,
  onDismiss,
}: {
  result: { hash: string; status: string; message: string; amount?: string; destination?: string } | null;
  onDismiss: () => void;
}) {
  if (!result) return null;
  const ok = result.status === 'success';

  return (
    <div
      className={`rounded-xl border p-4 ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {ok ? (
            <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <p className={`font-medium ${ok ? 'text-green-800' : 'text-red-800'}`}>
              {ok ? 'Transaction Successful' : 'Transaction Failed'}
            </p>
            {ok && result.amount && result.destination ? (
              <p className="text-sm text-green-700 mt-1">
                Sent {result.amount} XLM to <span className="font-mono">{shortKey(result.destination, 6)}</span>
              </p>
            ) : (
              <p className={`text-sm mt-1 ${ok ? 'text-green-700' : 'text-red-700'}`}>
                {ok ? `Hash: ${result.message}` : result.message}
              </p>
            )}
            {result.hash && (
              <div className="flex items-center gap-3 mt-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  StellarExpert
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(result.hash)}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Hash
                </button>
              </div>
            )}
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 ml-4">&times;</button>
      </div>
    </div>
  );
}

/* ───────── SendXLMForm ───────── */

function SendXLMForm({
  onSend,
  isSending,
  onClose,
}: {
  onSend: (dest: string, amount: string) => void;
  isSending: boolean;
  onClose: () => void;
}) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination && amount && parseFloat(amount) > 0) onSend(destination, amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (XLM)</label>
        <input
          type="number"
          step="0.0000001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSending || !destination || !amount || parseFloat(amount) <= 0}
          className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSending ? 'Sending\u2026' : 'Send XLM'}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2.5 text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ───────── AddAccountForm ───────── */

function AddAccountForm({
  onAddByKey,
  onAddFromWallet,
  onClose,
}: {
  onAddByKey: (key: string) => void;
  onAddFromWallet: () => void;
  onClose: () => void;
}) {
  const [publicKey, setPublicKey] = useState('');

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Enter a Stellar public key or add the currently active Freighter account.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="G..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <button
          onClick={() => { onAddByKey(publicKey); setPublicKey(''); }}
          disabled={!publicKey}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-gray-400">OR</span></div>
      </div>
      <button
        onClick={onAddFromWallet}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
      >
        Add Freighter Account
      </button>
      <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
}

/* ───────── AssetBalancesPanel ───────── */

function AssetBalancesPanel({ balances }: { balances: AssetBalance[] }) {
  const native = balances.find((b) => b.asset_type === 'native');
  const others = balances.filter((b) => b.asset_type !== 'native');

  return (
    <div className="space-y-2">
      {native && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              X
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Stellar Lumens</p>
              <p className="text-xs text-gray-500">XLM (native)</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">{fmtBalance(native.balance)}</p>
        </div>
      )}
      {others.map((a, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {a.asset_code?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{a.asset_code || 'Unknown'}</p>
              <p className="text-xs font-mono text-gray-500">{a.asset_issuer ? shortKey(a.asset_issuer) : 'native'}</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">{fmtBalance(a.balance)}</p>
        </div>
      ))}
      {balances.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No balances found</p>}
    </div>
  );
}

/* ───────── AccountDetailsPanel ───────── */

function AccountDetailsPanel({ details }: { details: AccountDetails }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Sequence', value: details.sequence, mono: true },
          { label: 'Sub-entries', value: details.subentry_count.toString() },
          { label: 'Low Threshold', value: details.thresholds.low_threshold.toString() },
          { label: 'Med Threshold', value: details.thresholds.med_threshold.toString() },
          { label: 'High Threshold', value: details.thresholds.high_threshold.toString() },
          { label: 'Last Ledger', value: details.last_modified_ledger.toString(), mono: true },
        ].map((f) => (
          <div key={f.label} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{f.label}</p>
            <p className={`text-sm font-medium text-gray-900 truncate ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
          </div>
        ))}
      </div>
      {details.signers.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Signers ({details.signers.length})</p>
          <div className="space-y-1">
            {details.signers.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                <span className="font-mono text-gray-700 truncate mr-2">{shortKey(s.key, 12)}</span>
                <span className="text-gray-500">weight: {s.weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── TransactionHistory ───────── */

function TransactionHistory({ transactions }: { transactions: TransactionRecord[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                tx.operation_type === 'payment' || tx.operation_type === 'create_account'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate capitalize">
                {tx.operation_type.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-mono">{tx.hash.slice(0, 10)}\u2026</span>
                <span className="mx-1">&middot;</span>
                {new Date(tx.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {tx.amount && (
              <span className="text-sm font-medium text-gray-900">
                {tx.amount} {tx.asset_code || 'XLM'}
              </span>
            )}
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Main: WalletDashboard ───────── */

export default function WalletDashboard() {
  const {
    accounts,
    selectedAccount,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    selectAccount,
    refreshBalances,
    sendXLM,
    addAccount,
    removeAccount,
    fundWithFriendbot,
    fetchAccountDetails,
    fetchTransactionHistory,
  } = useWallet();

  const [isSending, setIsSending] = useState(false);
  const [txResult, setTxResult] = useState<{ hash: string; status: string; message: string; amount?: string; destination?: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [tab, setTab] = useState<'balances' | 'assets' | 'details' | 'history'>('balances');

  const loadData = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      const [details, txs] = await Promise.all([
        fetchAccountDetails(selectedAccount.publicKey),
        fetchTransactionHistory(selectedAccount.publicKey),
      ]);
      setAccountDetails(details);
      setTransactions(txs);
    } catch {
      /* silent */
    }
  }, [selectedAccount, fetchAccountDetails, fetchTransactionHistory]);

  useEffect(() => {
    if (selectedAccount) loadData();
  }, [selectedAccount, loadData]);

  const handleSend = async (dest: string, amount: string) => {
    setIsSending(true);
    setTxResult(null);
    try {
      const r = await sendXLM(dest, amount);
      setTxResult(r);
      if (r.status === 'success') { setShowSend(false); loadData(); }
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    await loadData();
    setIsRefreshing(false);
  };

  const handleFund = async () => {
    if (!selectedAccount) return;
    setIsFunding(true);
    setTxResult(null);
    try {
      const hash = await fundWithFriendbot();
      setTxResult({ hash, status: 'success', message: hash, amount: '10,000' });
      loadData();
    } catch (err: any) {
      setTxResult({ hash: '', status: 'failed', message: err.message });
    } finally {
      setIsFunding(false);
    }
  };

  /* ──── not connected ──── */

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Wallet Balance Checker</h2>
          <p className="text-gray-500 mt-2">Connect your Freighter wallet (Stellar Testnet)</p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={connect}
            disabled={isConnecting}
            className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 text-lg"
          >
            {isConnecting ? 'Connecting\u2026' : 'Connect Freighter Wallet'}
          </button>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900 mb-1">Prerequisites</p>
            <p>1. Install Freighter browser extension</p>
            <p>2. Create a wallet and switch to Testnet</p>
            <p>3. Fund via Friendbot (automatic when balance is 0)</p>
          </div>
        </div>
      </div>
    );
  }

  /* ──── connected ──── */

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {accounts.length} account{accounts.length > 1 ? 's' : ''}
            {selectedAccount && ` \u00B7 ${selectedAccount.label}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {isRefreshing ? '\u23F3' : '\u21BB'} Refresh
          </button>
          <button
            onClick={disconnect}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* hero */}
      {selectedAccount && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm">{selectedAccount.label}</span>
            <div className="flex items-center bg-blue-500/30 px-3 py-1 rounded-full text-xs text-blue-100">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              Testnet
            </div>
          </div>
          <p className="text-4xl font-bold mb-3">
            {fmtBalance(selectedAccount.balance)}{' '}
            <span className="text-xl text-blue-200">XLM</span>
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-100 font-mono">{shortKey(selectedAccount.publicKey, 12)}</span>
              <button
                onClick={() => navigator.clipboard.writeText(selectedAccount.publicKey)}
                className="text-blue-200 hover:text-white"
                title="Copy address"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {parseFloat(selectedAccount.balance) === 0 && (
                <button
                  onClick={handleFund}
                  disabled={isFunding}
                  className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-medium hover:bg-yellow-300 disabled:opacity-50"
                >
                  {isFunding ? 'Funding\u2026' : 'Fund via Friendbot'}
                </button>
              )}
              <button
                onClick={() => setShowSend(!showSend)}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50"
              >
                Send XLM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* tx feedback */}
      {txResult && <TransactionFeedback result={txResult} onDismiss={() => setTxResult(null)} />}

      {/* send form */}
      {showSend && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send XLM</h3>
          <SendXLMForm onSend={handleSend} isSending={isSending} onClose={() => setShowSend(false)} />
        </div>
      )}

      {/* accounts list */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h3>
        <div className="grid gap-3">
          {accounts.map((acc) => (
            <BalanceCard
              key={acc.publicKey}
              account={acc}
              isSelected={selectedAccount?.publicKey === acc.publicKey}
              onSelect={() => selectAccount(acc.publicKey)}
              onRemove={() => removeAccount(acc.publicKey)}
              canRemove={accounts.length > 1}
            />
          ))}
        </div>
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
          >
            + Add Account
          </button>
        ) : (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <AddAccountForm
              onAddByKey={(k) => addAccount(k)}
              onAddFromWallet={() => addAccount()}
              onClose={() => setShowAdd(false)}
            />
          </div>
        )}
      </div>

      {/* detail tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['balances', 'assets', 'details', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize ${
                tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t === 'assets' ? 'All Assets' : t}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'balances' && (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div key={acc.publicKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{acc.label}</p>
                    <p className="text-xs font-mono text-gray-500">{shortKey(acc.publicKey, 6)}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {fmtBalance(acc.balance)} <span className="text-sm font-normal text-gray-500">XLM</span>
                  </p>
                </div>
              ))}
            </div>
          )}
          {tab === 'assets' && (accountDetails ? <AssetBalancesPanel balances={accountDetails.balances} /> : <p className="text-center text-gray-400 py-4">Loading\u2026</p>)}
          {tab === 'details' && (accountDetails ? <AccountDetailsPanel details={accountDetails} /> : <p className="text-center text-gray-400 py-4">Loading\u2026</p>)}
          {tab === 'history' && <TransactionHistory transactions={transactions} />}
        </div>
      </div>

      {/* network info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-700">Network</span>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <span>Network</span>
          <span className="font-medium text-gray-900">Stellar Testnet</span>
        </div>
        <div className="flex items-center justify-between text-gray-500 mt-1">
          <span>Horizon</span>
          <span className="font-mono text-xs text-gray-600">https://horizon-testnet.stellar.org</span>
        </div>
      </div>
    </div>
  );
}
