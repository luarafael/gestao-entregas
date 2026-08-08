import { cn } from '@/shared/utils/cn'
import type { PrestacaoScope } from '@/features/accounting/types/prestacaoCliente.types'

interface PrestacaoScopeSelectProps {
  value: PrestacaoScope
  onChange: (value: PrestacaoScope) => void
  className?: string
}

const options: { value: PrestacaoScope; label: string }[] = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'motoboy', label: 'Motoboy' },
  { value: 'cliente', label: 'Cliente' },
]

export function PrestacaoScopeSelect({
  value,
  onChange,
  className,
}: PrestacaoScopeSelectProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor="prestacao-scope"
        className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2"
      >
        <span className="shrink-0 font-medium">Tipo</span>
        <select
          id="prestacao-scope"
          value={value}
          onChange={(event) => onChange(event.target.value as PrestacaoScope)}
          className="h-9 min-w-44 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

interface PrestacaoHistoricoFilterSelectProps {
  value: 'all' | PrestacaoScope
  onChange: (value: 'all' | PrestacaoScope) => void
  className?: string
}

const historicoOptions: { value: 'all' | PrestacaoScope; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'motoboy', label: 'Motoboys' },
  { value: 'cliente', label: 'Clientes' },
]

export function PrestacaoHistoricoFilterSelect({
  value,
  onChange,
  className,
}: PrestacaoHistoricoFilterSelectProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor="prestacao-historico-filter"
        className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2"
      >
        <span className="shrink-0 font-medium">Filtrar</span>
        <select
          id="prestacao-historico-filter"
          value={value}
          onChange={(event) =>
            onChange(event.target.value as 'all' | PrestacaoScope)
          }
          className="h-9 min-w-36 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground"
        >
          {historicoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
