// Reusable skeleton shimmer components untuk loading states
// Usage: <SkeletonCard />, <SkeletonTable rows={5} cols={4} />, <SkeletonText lines={3} />

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function SkeletonText({ lines = 2, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <SkeletonBox className="h-4 w-1/3" />
      <SkeletonBox className="h-8 w-1/2" />
      <SkeletonBox className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonKpiCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4">
          <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-7 w-16" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className={`h-4 ${i === 0 ? 'w-8' : i === cols - 1 ? 'w-16' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="px-4 py-3 border-b border-surface-border">
        <SkeletonBox className="h-4 w-32" />
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-surface-border">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="space-y-2 mb-6">
      <SkeletonBox className="h-7 w-48" />
      <SkeletonBox className="h-4 w-72" />
    </div>
  );
}
