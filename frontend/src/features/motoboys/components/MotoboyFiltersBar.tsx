import { Input } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  ATIVO_OPTIONS,
  type MotoboyAtivoFilter,
  type MotoboyFilters,
} from '../schemas/motoboy.schema'

interface MotoboyFiltersBarProps {
  filters: MotoboyFilters
  onSearchChange: (search: string) => void
  onAtivoChange: (ativo: MotoboyAtivoFilter) => void
}

export function MotoboyFiltersBar({
  filters,
  onSearchChange,
  onAtivoChange,
}: MotoboyFiltersBarProps) {
  const activeAtivo = filters.ativo ?? 'all'

  return (
    <div className="space-y-4">
      <Input
        placeholder="Pesquisar por nome ou e-mail..."
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {ATIVO_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAtivoChange(option.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              activeAtivo === option.value
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
