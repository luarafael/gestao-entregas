import type { ReactNode, SVGProps } from 'react'
import { cn } from '@/shared/utils/cn'
import {
  IconAlert,
  IconBuilding,
  IconClock,
  IconCreditCard,
  IconMapPin,
  IconPackage,
  IconPhone,
  IconRoute,
  IconTag,
  IconTruck,
  IconUser,
  IconWallet,
} from '@/shared/components/icons'

/**
 * Tons semânticos — use pelo significado do dado, nunca por cor “bonita”.
 *
 * | Tom | Use para | Não use para |
 * |-----|----------|--------------|
 * | time | data, horário | — |
 * | client | nome de pessoa/cliente | empresa, valor |
 * | company | nome/tipo empresa | forma de pagamento |
 * | phone | telefone | — |
 * | address | endereço, bairro | — |
 * | motoboy | nome/identidade de motoboy | valor pago ao motoboy |
 * | imported | status “importado” | — |
 * | product | valor/rótulo de produto | totais genéricos |
 * | delivery | quantidade/contagem de entregas | endereço |
 * | money | valores em R$ (total, final, corrida) | forma de pagamento |
 * | motoboyFee | valor específico da entrega/repasse motoboy | nomes |
 * | payment | forma de pagamento (PIX/cartão/dinheiro) | nomes, totais |
 * | pending | pendência / repasse pendente | pago / valor final |
 */
export type MetaChipTone =
  | 'time'
  | 'client'
  | 'company'
  | 'phone'
  | 'address'
  | 'motoboy'
  | 'imported'
  | 'product'
  | 'delivery'
  | 'money'
  | 'motoboyFee'
  | 'payment'
  | 'pending'

const CHIP_TONES: Record<
  MetaChipTone,
  {
    container: string
    icon: string
    Icon: (props: SVGProps<SVGSVGElement>) => ReactNode
  }
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
  company: {
    container:
      'border-slate-500/30 bg-slate-500/10 text-slate-800 dark:text-slate-200',
    icon: 'text-slate-600 dark:text-slate-300',
    Icon: IconBuilding,
  },
  phone: {
    container:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400',
    Icon: IconPhone,
  },
  address: {
    container:
      'border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200',
    icon: 'text-amber-700 dark:text-amber-300',
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
      'border-orange-500/25 bg-orange-500/10 text-orange-900 dark:text-orange-200',
    icon: 'text-orange-700 dark:text-orange-300',
    Icon: IconTag,
  },
  delivery: {
    container:
      'border-blue-500/25 bg-blue-500/10 text-blue-900 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    Icon: IconPackage,
  },
  money: {
    container:
      'border-emerald-600/30 bg-emerald-600/10 text-emerald-900 dark:text-emerald-200',
    icon: 'text-emerald-700 dark:text-emerald-400',
    Icon: IconWallet,
  },
  motoboyFee: {
    container: 'border-primary/30 bg-primary/10 text-primary',
    icon: 'text-primary',
    Icon: IconWallet,
  },
  payment: {
    container:
      'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-900 dark:text-fuchsia-200',
    icon: 'text-fuchsia-600 dark:text-fuchsia-400',
    Icon: IconCreditCard,
  },
  pending: {
    container:
      'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
    icon: 'text-amber-700 dark:text-amber-300',
    Icon: IconAlert,
  },
}

export function MetaChip({
  tone,
  children,
  className,
  title,
  borderless = true,
}: {
  tone: MetaChipTone
  children: ReactNode
  className?: string
  title?: string
  /** Default true — chips exibem dados; borda só se precisar destacar como controle */
  borderless?: boolean
}) {
  const styles = CHIP_TONES[tone]
  const Icon = styles.Icon

  return (
    <span
      title={title}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium',
        borderless ? 'border-0' : 'border',
        styles.container,
        className,
      )}
    >
      <Icon className={cn('size-3.5 shrink-0', styles.icon)} aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}

export function MetaSectionTitle({
  tone,
  children,
}: {
  tone: MetaChipTone
  children: ReactNode
}) {
  const styles = CHIP_TONES[tone]
  const Icon = styles.Icon

  return (
    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center rounded-md',
          styles.container,
        )}
      >
        <Icon className={cn('size-3', styles.icon)} aria-hidden />
      </span>
      {children}
    </p>
  )
}

/**
 * Labeled field for history/detail cards (Data, Tipo, Nome, …).
 * Use this pattern in list cards so columns remain explicit without wide tables.
 */
export function MetaField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0 overflow-hidden text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
  )
}
