import { cn } from '@/shared/utils/cn'
import { useClientesByDate } from '@/features/accounting/hooks/usePrestacaoCliente'

interface ClienteSelectProps {
  data: string
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  id?: string
  error?: string
  layout?: 'inline' | 'stack'
  disabled?: boolean
}

export function ClienteSelect({
  data,
  value,
  onChange,
  label = 'Cliente',
  className,
  id = 'cliente-select',
  error,
  layout = 'inline',
  disabled = false,
}: ClienteSelectProps) {
  const clientesQuery = useClientesByDate(data)
  const clientes = clientesQuery.data?.clientes ?? []
  const isStack = layout === 'stack'

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'text-sm',
          isStack
            ? 'block font-medium text-foreground'
            : 'flex flex-col gap-1.5 text-muted-foreground sm:flex-row sm:items-center sm:gap-2',
        )}
      >
        <span className={cn('shrink-0', !isStack && 'font-medium')}>{label}</span>
        {!isStack ? (
          <select
            id={id}
            value={value}
            disabled={disabled || clientesQuery.isLoading}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              'h-9 min-w-44 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-danger/50',
            )}
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente} value={cliente}>
                {cliente}
              </option>
            ))}
          </select>
        ) : null}
      </label>

      {isStack ? (
        <select
          id={id}
          value={value}
          disabled={disabled || clientesQuery.isLoading}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-foreground',
            'transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-danger/50 focus:border-danger/50 focus:ring-danger/20',
          )}
        >
          <option value="">Selecione um cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente} value={cliente}>
              {cliente}
            </option>
          ))}
        </select>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {!clientesQuery.isLoading && clientes.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum cliente com entregas nesta data.
        </p>
      ) : null}
    </div>
  )
}
