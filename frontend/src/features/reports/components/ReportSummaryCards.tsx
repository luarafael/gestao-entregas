import {
  IconAlert,
  IconBuilding,
  IconCreditCard,
  IconPackage,
  IconReceipt,
  IconTrending,
  IconWallet,
} from '@/shared/components/icons'
import { StatCardSkeleton } from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'
import type { ReportSummary } from '@/shared/types/api.types'
import type { DashboardScope } from '@/features/dashboard/types'
import { StatCard } from '@/shared/components/ui/StatCard'
import { getPeriodLabel } from '../utils/chart.utils'

interface ReportSummaryCardsProps {
  scope?: DashboardScope
  summary?: ReportSummary
  isLoading?: boolean
}

export function ReportSummaryCards({
  scope = 'motoboy',
  summary,
  isLoading,
}: ReportSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: scope === 'cliente' ? 4 : 6 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const periodLabel = getPeriodLabel(summary?.period ?? 'week')

  if (scope === 'cliente') {
    return (
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pedidos no período"
          value={String(summary?.totalEntregas ?? 0)}
          description={`${periodLabel} · aba Cliente`}
          icon={<IconPackage className="size-5" />}
          accent="primary"
          delay={0}
        />
        <StatCard
          title="Valor total"
          value={formatCurrency(summary?.valorEntregas ?? 0)}
          description={`${periodLabel} · produtos + taxa motoboy`}
          icon={<IconWallet className="size-5" />}
          accent="success"
          delay={0.05}
        />
        <StatCard
          title="Média diária"
          value={String(summary?.mediaEntregasPorDia ?? 0)}
          description="Pedidos por dia com movimento"
          icon={<IconTrending className="size-5" />}
          accent="neutral"
          delay={0.1}
        />
        <StatCard
          title="Média de valor/dia"
          value={formatCurrency(summary?.mediaValorPorDia ?? 0)}
          description="Valor médio nos dias com pedidos"
          icon={<IconBuilding className="size-5" />}
          accent="warning"
          delay={0.15}
        />
      </div>
    )
  }

  if (scope === 'geral') {
    return (
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Entregas no período"
          value={String(summary?.totalEntregas ?? 0)}
          description={`${periodLabel} · motoboy + clientes`}
          icon={<IconPackage className="size-5" />}
          accent="primary"
          delay={0}
        />
        <StatCard
          title="Valor total"
          value={formatCurrency(summary?.valorEntregas ?? 0)}
          description={`${periodLabel} · visão combinada`}
          icon={<IconWallet className="size-5" />}
          accent="success"
          delay={0.05}
        />
        <StatCard
          title="Média diária"
          value={String(summary?.mediaEntregasPorDia ?? 0)}
          description={formatCurrency(summary?.mediaValorPorDia ?? 0)}
          icon={<IconTrending className="size-5" />}
          accent="neutral"
          delay={0.1}
        />
        <StatCard
          title="Dias com movimento"
          value={String(summary?.totalPrestacoes ?? 0)}
          description={formatCurrency(summary?.valorFinalPrestacoes ?? 0)}
          icon={<IconCreditCard className="size-5" />}
          accent="warning"
          delay={0.15}
        />
        <StatCard
          title="Média de valor/dia"
          value={formatCurrency(summary?.mediaValorPorDia ?? 0)}
          description="Valor médio nos dias com registros"
          icon={<IconWallet className="size-5" />}
          accent="success"
          delay={0.2}
        />
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        title="Entregas no período"
        value={String(summary?.totalEntregas ?? 0)}
        description={`${periodLabel} · prestações fechadas`}
        icon={<IconPackage className="size-5" />}
        accent="primary"
        delay={0}
      />
      <StatCard
        title="Valor das entregas"
        value={formatCurrency(summary?.valorEntregas ?? 0)}
        description={`${periodLabel} · nas prestações`}
        icon={<IconWallet className="size-5" />}
        accent="success"
        delay={0.05}
      />
      <StatCard
        title="Média diária"
        value={String(summary?.mediaEntregasPorDia ?? 0)}
        description="Média por dia com prestação fechada"
        icon={<IconTrending className="size-5" />}
        accent="neutral"
        delay={0.1}
      />
      <StatCard
        title="Prestações geradas"
        value={String(summary?.totalPrestacoes ?? 0)}
        description={formatCurrency(summary?.valorFinalPrestacoes ?? 0)}
        icon={<IconReceipt className="size-5" />}
        accent="warning"
        delay={0.15}
      />
      <StatCard
        title="Pendências abertas"
        value={String(summary?.pendenciasAbertas ?? 0)}
        description={formatCurrency(summary?.valorPendenciasAbertas ?? 0)}
        icon={<IconAlert className="size-5" />}
        accent="warning"
        delay={0.2}
      />
      <StatCard
        title="Média de valor/dia"
        value={formatCurrency(summary?.mediaValorPorDia ?? 0)}
        description="Valor das entregas por dia fechado"
        icon={<IconWallet className="size-5" />}
        accent="success"
        delay={0.25}
      />
    </div>
  )
}
