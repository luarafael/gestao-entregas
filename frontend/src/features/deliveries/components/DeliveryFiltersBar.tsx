import { Input } from '@/shared/components/ui'
import {
  MotoboySelect,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { cn } from '@/shared/utils/cn'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import {
  DATE_FILTER_OPTIONS,
  SORT_OPTIONS,
  type DateFilter,
  type DeliveryFilters,
  type SortField,
  type SortOrder,
} from '../schemas/delivery.schema'

interface DeliveryFiltersBarProps {
  filters: DeliveryFilters
  onSearchChange: (search: string) => void
  onFilterChange: (filter: DateFilter) => void
  onSortByChange: (sortBy: SortField) => void
  onSortOrderChange: (sortOrder: SortOrder) => void
  onMotoboyChange: (motoboyId?: string) => void
}

export function DeliveryFiltersBar({
  filters,
  onSearchChange,
  onFilterChange,
  onSortByChange,
  onSortOrderChange,
  onMotoboyChange,
}: DeliveryFiltersBarProps) {
  const isAdmin = useIsAdmin()
  const motoboyValue: MotoboySelectValue = filters.motoboyId ?? 'all'

  return (
    <div className="space-y-4">
      <Input
        placeholder="Pesquisar por cliente, endereço ou bairro..."
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {DATE_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filters.filter === option.value
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/60 bg-surface/50 text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <MotoboySelect
            id="filtro-motoboy-entregas"
            value={motoboyValue}
            allowAll
            onChange={(value) =>
              onMotoboyChange(value === 'all' ? undefined : value)
            }
          />
        ) : null}

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Ordenar por
          <select
            value={filters.sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortField)}
            className="h-9 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Direção
          <select
            value={filters.sortOrder}
            onChange={(event) =>
              onSortOrderChange(event.target.value as SortOrder)
            }
            className="h-9 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground"
          >
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
        </label>
      </div>
    </div>
  )
}
