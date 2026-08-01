import {
  IconAlert,
  IconPackage,
  IconReceipt,
  IconTrending,
  IconWallet,
} from '@/shared/components/icons'
import { StatCardSkeleton } from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'
import type { ReportSummary } from '@/shared/types/api.types'
import { StatCard } from '@/shared/components/ui/StatCard'
import { getPeriodLabel } from '../utils/chart.utils'

interface ReportSummaryCardsProps {
  summary?: ReportSummary
  isLoading?: boolean
}

export function ReportSummaryCards({
  summary,
  isLoading,
}: ReportSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const periodLabel = getPeriodLabel(summary?.period ?? 'week')

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        description="Entregas por dia"
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
        description="Valor final médio no período"
        icon={<IconWallet className="size-5" />}
        accent="success"
        delay={0.25}
      />
    </div>
  )
}
