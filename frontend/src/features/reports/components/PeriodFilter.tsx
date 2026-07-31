import { cn } from '@/shared/utils/cn'
import type { ReportPeriod } from '@/shared/types/api.types'

interface PeriodFilterProps {
  value: ReportPeriod
  onChange: (period: ReportPeriod) => void
}

const options: { value: ReportPeriod; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="inline-flex rounded-xl border border-border/60 bg-surface/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
