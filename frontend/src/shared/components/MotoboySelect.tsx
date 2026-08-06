import { useMotoboysList } from '@/features/motoboys/hooks/useMotoboys'
import { cn } from '@/shared/utils/cn'

export type MotoboySelectValue = 'all' | string

interface MotoboySelectProps {
  value: MotoboySelectValue
  onChange: (value: MotoboySelectValue) => void
  /** When false, hides the "Todos" option (e.g. monitoramento). Default true. */
  allowAll?: boolean
  label?: string
  className?: string
  selectClassName?: string
  id?: string
}

export function MotoboySelect({
  value,
  onChange,
  allowAll = true,
  label = 'Motoboy',
  className,
  selectClassName,
  id = 'motoboy-select',
}: MotoboySelectProps) {
  const motoboysQuery = useMotoboysList({
    page: 1,
    limit: 100,
    search: '',
    ativo: 'true',
  })

  const motoboys = motoboysQuery.data?.data ?? []

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2',
        className,
      )}
    >
      <span className="shrink-0 font-medium">{label}</span>
      <select
        id={id}
        value={value}
        disabled={motoboysQuery.isLoading}
        onChange={(event) =>
          onChange(event.target.value as MotoboySelectValue)
        }
        className={cn(
          'h-9 min-w-44 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground',
          'disabled:cursor-not-allowed disabled:opacity-60',
          selectClassName,
        )}
      >
        {allowAll ? <option value="all">Todos</option> : null}
        {!allowAll && motoboys.length === 0 ? (
          <option value="">Selecione um motoboy</option>
        ) : null}
        {motoboys.map((motoboy) => (
          <option key={motoboy.id} value={motoboy.id}>
            {motoboy.nome}
          </option>
        ))}
      </select>
    </label>
  )
}
