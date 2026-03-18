function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-foreground/10 ${className ?? ""}`} />;
}

export default function DetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-5 w-36 mb-6" />

      <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-5 h-5" />
          ))}
        </div>

        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />

        <Skeleton className="h-px w-full mb-6" />

        <Skeleton className="h-4 w-20 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
