import { Link } from 'react-router-dom'
import {
  IconAlert,
  IconPackage,
  IconTrending,
  IconWallet,
} from '@/shared/components/icons'
import {
  EmptyState,
  StatCardSkeleton,
  TableSkeleton,
} from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'
import type { Entrega } from '@/shared/types/api.types'
import {
  useDashboardStats,
  useTodayDeliveries,
} from '@/features/dashboard/hooks/useDashboard'
import {
  DailyTrendChart,
  NeighborhoodChart,
  useDailyTrend,
  useNeighborhoodReport,
  useReportSummary,
} from '@/features/reports'
import { getPeriodLabel } from '@/features/reports/utils/chart.utils'
import { StatCard } from '../components/StatCard'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DeliveriesTable({ deliveries }: { deliveries: Entrega[] }) {
  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<IconPackage className="size-6" />}
        title="Nenhuma entrega hoje"
        description="As entregas cadastradas durante o dia aparecerão aqui."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-3 font-medium">Horário</th>
            <th className="px-3 py-3 font-medium">Cliente</th>
            <th className="px-3 py-3 font-medium">Endereço</th>
            <th className="px-3 py-3 font-medium">Bairro</th>
            <th className="px-3 py-3 font-medium text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => (
            <tr
              key={delivery.id}
              className="border-b border-border/40 transition-colors hover:bg-surface/40"
            >
              <td className="px-3 py-3 text-muted-foreground">
                {formatTime(delivery.horario)}
              </td>
              <td className="px-3 py-3 font-medium">
                {delivery.nomeCliente ?? '—'}
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {delivery.endereco}
              </td>
              <td className="px-3 py-3">{delivery.bairro}</td>
              <td className="px-3 py-3 text-right font-medium">
                {formatCurrency(Number(delivery.valorEntrega))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardPage() {
  const statsQuery = useDashboardStats()
  const deliveriesQuery = useTodayDeliveries()
  const weekSummaryQuery = useReportSummary('week')
  const dailyTrendQuery = useDailyTrend(7)
  const neighborhoodQuery = useNeighborhoodReport('week', 5)

  const stats = statsQuery.data
  const weekSummary = weekSummaryQuery.data
  const deliveries = deliveriesQuery.data?.data ?? []
  const isLoading = statsQuery.isLoading || deliveriesQuery.isLoading
  const hasError = statsQuery.isError && deliveriesQuery.isError

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Resumo do dia
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe entregas, valores e pendências em tempo real.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Entregas Hoje"
              value={String(stats?.entregasHoje ?? 0)}
              description="Total registrado hoje"
              icon={<IconPackage className="size-5" />}
              accent="primary"
              delay={0}
            />
            <StatCard
              title="Valor Recebido Hoje"
              value={formatCurrency(stats?.valorRecebidoHoje ?? 0)}
              description="Soma das entregas"
              icon={<IconWallet className="size-5" />}
              accent="success"
              delay={0.05}
            />
            <StatCard
              title="Pendências"
              value={String(stats?.totalPendencias ?? 0)}
              description="Itens em aberto"
              icon={<IconAlert className="size-5" />}
              accent="warning"
              delay={0.1}
            />
            <StatCard
              title="Valor Total do Dia"
              value={formatCurrency(stats?.valorTotalDia ?? 0)}
              description="Entregas + pendências"
              icon={<IconTrending className="size-5" />}
              accent="neutral"
              delay={0.15}
            />
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Indicadores da semana
            </h3>
            <p className="text-sm text-muted-foreground">
              {getPeriodLabel('week')}
            </p>
          </div>
          <Link
            to="/relatorios"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver relatórios
          </Link>
        </div>

        {weekSummaryQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              title="Entregas na semana"
              value={String(weekSummary?.totalEntregas ?? 0)}
              description={formatCurrency(weekSummary?.valorEntregas ?? 0)}
              icon={<IconPackage className="size-5" />}
              accent="primary"
              delay={0}
            />
            <StatCard
              title="Média diária"
              value={String(weekSummary?.mediaEntregasPorDia ?? 0)}
              description={`${formatCurrency(weekSummary?.mediaValorPorDia ?? 0)} por dia`}
              icon={<IconTrending className="size-5" />}
              accent="neutral"
              delay={0.05}
            />
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DailyTrendChart
          data={dailyTrendQuery.data}
          isLoading={dailyTrendQuery.isLoading}
        />
        <NeighborhoodChart
          data={neighborhoodQuery.data}
          isLoading={neighborhoodQuery.isLoading}
          periodLabel={getPeriodLabel('week')}
        />
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Entregas do dia
            </h3>
            <p className="text-sm text-muted-foreground">
              Últimas entregas registradas
            </p>
          </div>
        </div>

        {deliveriesQuery.isLoading ? (
          <TableSkeleton rows={4} />
        ) : hasError ? (
          <EmptyState
            icon={<IconPackage className="size-6" />}
            title="API indisponível"
            description="Inicie o backend e o banco de dados para carregar os dados do dashboard."
          />
        ) : (
          <DeliveriesTable deliveries={deliveries} />
        )}
      </section>
    </div>
  )
}
