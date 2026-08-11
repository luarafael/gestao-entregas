import { cn } from '@/shared/utils/cn'
import {
  DASHBOARD_SCOPE_OPTIONS,
  type DashboardScope,
} from '@/features/dashboard/types'

interface ScopeToggleProps {
  value: DashboardScope
  onChange: (value: DashboardScope) => void
}

export function ScopeToggle({ value, onChange }: ScopeToggleProps) {
  return (
    <div className="flex rounded-xl border border-border/60 bg-surface/40 p-1">
      {DASHBOARD_SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4',
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
