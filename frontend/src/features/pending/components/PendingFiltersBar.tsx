import { Input } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  STATUS_OPTIONS,
  type PendingFilters,
  type PendingStatus,
} from '../schemas/pending.schema'

interface PendingFiltersBarProps {
  filters: PendingFilters
  onSearchChange: (search: string) => void
  onStatusChange: (status?: PendingStatus) => void
}

export function PendingFiltersBar({
  filters,
  onSearchChange,
  onStatusChange,
}: PendingFiltersBarProps) {
  const activeStatus = filters.status ?? 'ALL'

  return (
    <div className="space-y-4">
      <Input
        placeholder="Pesquisar por descrição..."
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onStatusChange(option.value === 'ALL' ? undefined : option.value)
            }
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              activeStatus === option.value
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/60 bg-surface/50 text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
