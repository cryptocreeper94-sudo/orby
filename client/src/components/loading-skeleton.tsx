import { cn } from "@/lib/utils";

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/5", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden", className)}>
      <div className="p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        </div>
        <SkeletonPulse className="h-3 w-full" />
        <SkeletonPulse className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden", className)}>
      <div className="p-4">
        <div className="flex gap-4 mb-4 pb-3 border-b border-white/5">
          <SkeletonPulse className="h-3 w-24" />
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-3 w-20" />
          <SkeletonPulse className="h-3 w-16" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-white/5 last:border-0">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-5">
          <SkeletonPulse className="h-3 w-20 mb-3" />
          <SkeletonPulse className="h-8 w-24 mb-2" />
          <SkeletonPulse className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden", className)}>
      <div className="p-5 sm:p-7">
        <SkeletonPulse className="h-5 w-32 mb-6" />
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonPulse
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden", className)}>
      <div className="p-5 sm:p-7 flex flex-col items-center text-center space-y-4">
        <SkeletonPulse className="h-20 w-20 rounded-full" />
        <SkeletonPulse className="h-5 w-40" />
        <SkeletonPulse className="h-3 w-32" />
        <div className="flex gap-6 pt-2">
          <div className="text-center space-y-2">
            <SkeletonPulse className="h-6 w-12 mx-auto" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
          <div className="text-center space-y-2">
            <SkeletonPulse className="h-6 w-12 mx-auto" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
          <div className="text-center space-y-2">
            <SkeletonPulse className="h-6 w-12 mx-auto" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
          <SkeletonPulse className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-40" />
            <SkeletonPulse className="h-3 w-24" />
          </div>
          <SkeletonPulse className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden", className)}>
      <SkeletonPulse className="aspect-square w-full" />
      <div className="p-5 sm:p-7 space-y-3">
        <SkeletonPulse className="h-5 w-3/4" />
        <SkeletonPulse className="h-3 w-1/2" />
        <div className="flex justify-between pt-2">
          <SkeletonPulse className="h-4 w-20" />
          <SkeletonPulse className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen bg-[#050508] p-4 sm:p-6 lg:p-8 space-y-8", className)}>
      <div className="flex items-center gap-4 mb-8">
        <SkeletonPulse className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-3 w-32" />
        </div>
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartSkeleton className="md:col-span-2" />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
