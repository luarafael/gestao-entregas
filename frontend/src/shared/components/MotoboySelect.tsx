import { useMotoboysList } from '@/features/motoboys/hooks/useMotoboys'
import { cn } from '@/shared/utils/cn'
import type { MotoboyAtivoFilter } from '@/features/motoboys/schemas/motoboy.schema'

export type MotoboySelectValue = 'all' | string

export const motoboySelectToolbarProps = {
  className: 'min-w-0',
  selectClassName: 'min-w-0 w-full sm:w-auto sm:min-w-36 sm:max-w-48',
} as const

interface MotoboySelectProps {
  value: MotoboySelectValue
  onChange: (value: MotoboySelectValue) => void
  /** When false, hides the "Todos" option (e.g. form create). Default true. */
  allowAll?: boolean
  label?: string
  className?: string
  selectClassName?: string
  id?: string
  error?: string
  /** inline = horizontal label (filters); stack = form field layout */
  layout?: 'inline' | 'stack'
  ativo?: MotoboyAtivoFilter
  disabled?: boolean
}

export function MotoboySelect({
  value,
  onChange,
  allowAll = true,
  label = 'Motoboy',
  className,
  selectClassName,
  id = 'motoboy-select',
  error,
  layout = 'inline',
  ativo = 'true',
  disabled = false,
}: MotoboySelectProps) {
  const motoboysQuery = useMotoboysList({
    page: 1,
    limit: 100,
    search: '',
    ativo,
  })

  const motoboys = motoboysQuery.data?.data ?? []
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
            disabled={disabled || motoboysQuery.isLoading}
            onChange={(event) =>
              onChange(event.target.value as MotoboySelectValue)
            }
            className={cn(
              'h-9 min-w-44 rounded-lg border border-border/70 bg-surface/50 px-2 text-sm text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-danger/50',
              selectClassName,
            )}
          >
            {allowAll ? <option value="all">Todos</option> : null}
            {!allowAll ? (
              <option value="">Selecione um motoboy</option>
            ) : null}
            {motoboys.map((motoboy) => (
              <option key={motoboy.id} value={motoboy.id}>
                {motoboy.nome}
              </option>
            ))}
          </select>
        ) : null}
      </label>

      {isStack ? (
        <select
          id={id}
          value={value}
          disabled={disabled || motoboysQuery.isLoading}
          onChange={(event) =>
            onChange(event.target.value as MotoboySelectValue)
          }
          className={cn(
            'h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-foreground',
            'transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-danger/50 focus:border-danger/50 focus:ring-danger/20',
            selectClassName,
          )}
        >
          {allowAll ? <option value="all">Todos</option> : null}
          {!allowAll ? (
            <option value="">Selecione um motoboy</option>
          ) : null}
          {motoboys.map((motoboy) => (
            <option key={motoboy.id} value={motoboy.id}>
              {motoboy.nome}
            </option>
          ))}
        </select>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}
