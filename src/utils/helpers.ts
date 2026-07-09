export function shortKey(k: string, n = 8) {
  return `${k.slice(0, n)}\u2026${k.slice(-n)}`;
}

export function fmtBalance(b: string) {
  return parseFloat(b).toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 7,
  });
}

export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return fn().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise<T>((resolve) => setTimeout(resolve, delay)).then(() =>
      retry(fn, retries - 1, delay),
    );
  });
}

export class AppError extends Error {
  constructor(
    message: string,
    public type: 'auth' | 'contract' | 'network' | 'rpc' | 'unknown' = 'unknown',
    public code?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function classifyError(err: any): AppError {
  if (err instanceof AppError) return err;
  if (err?.type === 'auth' || err?.message?.includes('require_auth') || err?.message?.includes('rejected')) {
    return new AppError('Authentication required. Please approve in Freighter.', 'auth');
  }
  if (err?.type === 'network' || err?.message?.includes('fetch') || err?.code === 'NETWORK_ERROR') {
    return new AppError('Network error. Check your connection.', 'network');
  }
  if (err?.type === 'rpc' || err?.message?.includes('timeout')) {
    return new AppError('Soroban RPC error. The service may be unavailable.', 'rpc');
  }
  if (err?.type === 'contract' || err?.code !== undefined) {
    return new AppError(`Contract error (code ${err.code || 'unknown'}).`, 'contract', err.code);
  }
  return new AppError(err?.message || 'Unknown error');
}