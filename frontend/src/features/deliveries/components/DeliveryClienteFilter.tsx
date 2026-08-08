import { cn } from '@/shared/utils/cn'
import { useDeliveryClientes } from '../hooks/useDeliveries'
import type { DateFilter } from '../schemas/delivery.schema'

interface DeliveryClienteFilterProps {
  filter: DateFilter
  motoboyId?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DeliveryClienteFilter({
  filter,
  motoboyId,
  value,
  onChange,
  className,
}: DeliveryClienteFilterProps) {
  const clientesQuery = useDeliveryClientes({ filter, motoboyId })
  const clientes = clientesQuery.data?.clientes ?? []

  return (
    <label
      className={cn(
        'flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2',
        className,
      )}
    >
      <span className="shrink-0 font-medium">Cliente</span>
      <select
        value={value}
        disabled={clientesQuery.isLoading}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-44 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground disabled:opacity-60"
      >
        <option value="">Todos</option>
        {clientes.map((cliente) => (
          <option key={cliente} value={cliente}>
            {cliente}
          </option>
        ))}
      </select>
    </label>
  )
}
