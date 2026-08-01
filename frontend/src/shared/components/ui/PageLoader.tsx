import { TableSkeleton } from './Skeleton'

export function PageLoader() {
  return (
    <div className="space-y-4 py-4" aria-busy="true" aria-label="Carregando página">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
      <TableSkeleton rows={5} />
    </div>
  )
}
