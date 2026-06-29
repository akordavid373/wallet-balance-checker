export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
      <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-48" />
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-white/30 rounded w-20 mb-4" />
      <div className="h-10 bg-white/30 rounded w-48 mb-4" />
      <div className="h-4 bg-white/30 rounded w-64" />
    </div>
  );
}

export function SkeletonTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}
