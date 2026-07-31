import { Skeleton } from '@/shared/components/ui'

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
