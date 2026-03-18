function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-foreground/10 ${className ?? ""}`} />;
}

export default function WidgetsLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6">
            <Skeleton className="h-6 w-40 mb-2" />
            <div className="flex items-center gap-4 mt-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
