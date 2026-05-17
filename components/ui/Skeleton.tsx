export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.05] ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass space-y-4 p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="app-page animate-fade-in space-y-5">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <SkeletonCard />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="app-page animate-fade-in space-y-5">
      <Skeleton className="h-14 w-2/3" />
      <SkeletonCard />
      <SkeletonCard />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
