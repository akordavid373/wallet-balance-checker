import ErrorBoundary from './components/ErrorBoundary';
import WalletDashboard from './components/WalletDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <WalletDashboard />
      </ErrorBoundary>
    </div>
  );
}
