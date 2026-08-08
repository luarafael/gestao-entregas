import type { ReactNode } from 'react'
import type { SVGProps } from 'react'
import { cn } from '@/shared/utils/cn'
import {
  IconClock,
  IconCreditCard,
  IconMapPin,
  IconPhone,
  IconRoute,
  IconTag,
  IconTruck,
  IconUser,
  IconWallet,
} from '@/shared/components/icons'

type ChipTone =
  | 'time'
  | 'client'
  | 'phone'
  | 'address'
  | 'motoboy'
  | 'imported'
  | 'product'
  | 'delivery'
  | 'motoboyFee'
  | 'payment'

const CHIP_TONES: Record<
  ChipTone,
  { container: string; icon: string; Icon: (props: SVGProps<SVGSVGElement>) => ReactNode }
> = {
  time: {
    container:
      'border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200',
    icon: 'text-sky-600 dark:text-sky-400',
    Icon: IconClock,
  },
  client: {
    container:
      'border-violet-500/25 bg-violet-500/10 text-violet-900 dark:text-violet-200',
    icon: 'text-violet-600 dark:text-violet-400',
    Icon: IconUser,
  },
  phone: {
    container:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400',
    Icon: IconPhone,
  },
  address: {
    container:
      'border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    icon: 'text-amber-700 dark:text-amber-400',
    Icon: IconMapPin,
  },
  motoboy: {
    container:
      'border-indigo-500/25 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200',
    icon: 'text-indigo-600 dark:text-indigo-400',
    Icon: IconRoute,
  },
  imported: {
    container:
      'border-teal-500/25 bg-teal-500/10 text-teal-900 dark:text-teal-200',
    icon: 'text-teal-600 dark:text-teal-400',
    Icon: IconTruck,
  },
  product: {
    container:
      'border-orange-500/25 bg-orange-500/10 text-orange-950 dark:text-orange-100',
    icon: 'text-orange-600 dark:text-orange-400',
    Icon: IconTag,
  },
  delivery: {
    container:
      'border-blue-500/25 bg-blue-500/10 text-blue-900 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    Icon: IconTruck,
  },
  motoboyFee: {
    container:
      'border-primary/30 bg-primary/10 text-primary',
    icon: 'text-primary',
    Icon: IconWallet,
  },
  payment: {
    container:
      'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-900 dark:text-fuchsia-200',
    icon: 'text-fuchsia-600 dark:text-fuchsia-400',
    Icon: IconCreditCard,
  },
}

export function DeliveryCardChip({
  tone,
  children,
  className,
  title,
}: {
  tone: ChipTone
  children: ReactNode
  className?: string
  title?: string
}) {
  const styles = CHIP_TONES[tone]
  const Icon = styles.Icon

  return (
    <span
      title={title}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium',
        styles.container,
        className,
      )}
    >
      <Icon className={cn('size-3.5 shrink-0', styles.icon)} aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}

export function DeliveryCardSectionTitle({
  tone,
  children,
}: {
  tone: ChipTone
  children: ReactNode
}) {
  const styles = CHIP_TONES[tone]
  const Icon = styles.Icon

  return (
    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center rounded-md border',
          styles.container,
        )}
      >
        <Icon className={cn('size-3', styles.icon)} aria-hidden />
      </span>
      {children}
    </p>
  )
}

export function DeliveryCardHeader({
  horario,
  nomeCliente,
  telefone,
  endereco,
  motoboyNome,
  imported,
}: {
  horario: string
  nomeCliente?: string | null
  telefone?: string | null
  endereco: string
  motoboyNome?: string | null
  imported?: boolean
}) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <DeliveryCardChip tone="time">{horario}</DeliveryCardChip>
        {imported ? (
          <DeliveryCardChip tone="imported">Importado</DeliveryCardChip>
        ) : null}
        {motoboyNome ? (
          <DeliveryCardChip tone="motoboy" title={`Motoboy: ${motoboyNome}`}>
            {motoboyNome}
          </DeliveryCardChip>
        ) : null}
      </div>

      <DeliveryCardChip
        tone="client"
        className="max-w-full text-sm font-semibold"
        title={nomeCliente ?? undefined}
      >
        {nomeCliente?.trim() || 'Sem nome de cliente'}
      </DeliveryCardChip>

      {telefone ? (
        <DeliveryCardChip tone="phone" className="tabular-nums">
          {telefone}
        </DeliveryCardChip>
      ) : null}

      <DeliveryCardChip tone="address" className="w-full items-start whitespace-normal">
        <span className="line-clamp-2 text-left leading-relaxed">{endereco}</span>
      </DeliveryCardChip>
    </div>
  )
}
