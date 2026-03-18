function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-foreground/10 ${className ?? ""}`} />;
}

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-8 w-20 mb-8" />

      <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6 mb-6">
        <Skeleton className="h-6 w-36 mb-4" />
        <Skeleton className="h-4 w-28 mb-2" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6 mb-6">
        <Skeleton className="h-6 w-28 mb-4" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-foreground/5 rounded-lg p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
