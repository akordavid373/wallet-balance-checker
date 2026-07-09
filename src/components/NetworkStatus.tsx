import { useState, useEffect } from 'react';
import { config } from '../config';

type NetworkHealth = 'checking' | 'healthy' | 'degraded' | 'down';

export default function NetworkStatus() {
  const [health, setHealth] = useState<NetworkHealth>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${config.horizonUrl}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!cancelled) setHealth(res.ok ? 'healthy' : 'degraded');
      } catch {
        if (!cancelled) setHealth('down');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const colors: Record<NetworkHealth, string> = {
    checking: 'bg-gray-400',
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  const labels: Record<NetworkHealth, string> = {
    checking: 'Checking...',
    healthy: 'Testnet Online',
    degraded: 'Testnet Degraded',
    down: 'Testnet Offline',
  };

  if (health === 'checking') return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className={`w-2 h-2 rounded-full ${colors[health]}`} />
      <span>{labels[health]}</span>
    </div>
  );
}