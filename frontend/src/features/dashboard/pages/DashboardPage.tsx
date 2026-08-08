import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconAlert,
  IconPackage,
  IconTrending,
  IconWallet,
} from '@/shared/components/icons'
import {
  Badge,
  EmptyState,
  MetaChip,
  PAGE_CARD_ARTICLE,
  PagePanel,
  PageShell,
  StatCard,
  StatCardSkeleton,
  TableSkeleton,
} from '@/shared/components/ui'
import {
  MotoboySelect,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import type { Entrega } from '@/shared/types/api.types'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  useDashboardStats,
  useTodayDeliveries,
} from '@/features/dashboard/hooks/useDashboard'
import {
  useNeighborhoodReport,
  usePeriodDailyBreakdown,
  useReportSummary,
} from '@/features/reports/hooks/useReports'
import { getPeriodLabel } from '@/features/reports/utils/chart.utils'
import { FormaPagamentoBadge } from '@/features/deliveries/components/FormaPagamentoBadge'

const DailyTrendChart = lazy(() =>
  import('@/features/reports/components/DailyTrendChart').then((module) => ({
    default: module.DailyTrendChart,
  })),
)

const NeighborhoodChart = lazy(() =>
  import('@/features/reports/components/NeighborhoodChart').then((module) => ({
    default: module.NeighborhoodChart,
  })),
)

function ChartFallback() {
  return <div className="h-72 min-w-0 animate-pulse rounded-2xl bg-surface/60" />
}

function TodayDeliveriesList({
  deliveries,
  showMotoboy,
}: {
  deliveries: Entrega[]
  showMotoboy: boolean
}) {
  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<IconPackage className="size-6" />}
        title="Nenhuma entrega hoje"
        description="As entregas cadastradas durante o dia aparecerão aqui."
        action={
          <Link
            to="/entregas"
            className="text-sm font-medium text-primary hover:underline"
          >
            Cadastrar entrega
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => {
        const endereco = [delivery.endereco, delivery.bairro, delivery.cidade]
          .filter(Boolean)
          .join(' — ')

        return (
          <article key={delivery.id} className={cn(PAGE_CARD_ARTICLE)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <MetaChip tone="time">
                    {formatTimeBR(delivery.horario)}
                  </MetaChip>
                  {showMotoboy && delivery.motoboy?.nome ? (
                    <MetaChip
                      tone="motoboy"
                      title={`Motoboy: ${delivery.motoboy.nome}`}
                    >
                      {delivery.motoboy.nome}
                    </MetaChip>
                  ) : null}
                  {delivery.pagoPeloCliente ? (
                    <Badge variant="warning" className="text-[10px]">
                      Pago pelo cliente
                    </Badge>
                  ) : null}
                </div>

                <MetaChip
                  tone="client"
                  className="max-w-full text-sm font-semibold"
                  title={delivery.nomeCliente ?? undefined}
                >
                  {delivery.nomeCliente?.trim() || 'Sem nome de cliente'}
                </MetaChip>

                <MetaChip
                  tone="address"
                  className="w-full items-start whitespace-normal"
                >
                  <span className="line-clamp-2 text-left leading-relaxed">
                    {endereco}
                  </span>
                </MetaChip>
              </div>

              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                <MetaChip tone="money" className="justify-center tabular-nums">
                  {formatCurrency(Number(delivery.valorEntrega))}
                </MetaChip>
                {delivery.formaPagamento ? (
                  <FormaPagamentoBadge
                    value={delivery.formaPagamento}
                    className="w-full text-xs py-1 sm:w-auto"
                  />
                ) : null}
                {delivery.valorProduto ? (
                  <MetaChip tone="product" className="justify-center tabular-nums">
                    Produto: {formatCurrency(Number(delivery.valorProduto))}
                  </MetaChip>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function DashboardPage() {
  const isAdmin = useIsAdmin()
  const userId = useAuthStore((state) => state.user?.id)
  const [motoboyFilter, setMotoboyFilter] =
    useState<MotoboySelectValue>('all')

  const motoboyId = isAdmin
    ? motoboyFilter === 'all'
      ? undefined
      : motoboyFilter
    : userId

  const queriesEnabled = isAdmin || Boolean(userId)

  const statsQuery = useDashboardStats(motoboyId, queriesEnabled)
  const deliveriesQuery = useTodayDeliveries(motoboyId, queriesEnabled)
  const weekSummaryQuery = useReportSummary('week', motoboyId, queriesEnabled)
  const dailyBreakdownQuery = usePeriodDailyBreakdown(
    'week',
    motoboyId,
    queriesEnabled,
  )
  const neighborhoodQuery = useNeighborhoodReport(
    'week',
    5,
    motoboyId,
    queriesEnabled,
  )

  const stats = statsQuery.data
  const weekSummary = weekSummaryQuery.data
  const deliveries = deliveriesQuery.data?.data ?? []
  const isLoading = statsQuery.isLoading || deliveriesQuery.isLoading
  const hasError = statsQuery.isError || deliveriesQuery.isError

  return (
    <PageShell>
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">
              Resumo do dia
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? motoboyId
                  ? 'Visão individual do motoboy selecionado.'
                  : 'Visão geral de todos os motoboys.'
                : 'Visão do seu dia e indicadores da semana.'}
            </p>
          </div>
          {isAdmin ? (
            <MotoboySelect
              value={motoboyFilter}
              onChange={setMotoboyFilter}
              allowAll
            />
          ) : null}
        </div>

        {!queriesEnabled || isLoading ? (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight">
              Indicadores da semana
            </h3>
            <p className="text-sm text-muted-foreground">
              {getPeriodLabel('week')}
            </p>
          </div>
          <Link
            to="/relatorios"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Ver relatórios
          </Link>
        </div>

        {weekSummaryQuery.isLoading ? (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
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
              description={`${formatCurrency(weekSummary?.mediaValorPorDia ?? 0)} por dia fechado`}
              icon={<IconTrending className="size-5" />}
              accent="neutral"
              delay={0.05}
            />
          </div>
        )}
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <Suspense fallback={<ChartFallback />}>
            <DailyTrendChart
              data={dailyBreakdownQuery.data}
              isLoading={dailyBreakdownQuery.isLoading}
              periodLabel={getPeriodLabel('week')}
            />
          </Suspense>
        </div>
        <div className="min-w-0">
          <Suspense fallback={<ChartFallback />}>
            <NeighborhoodChart
              data={neighborhoodQuery.data}
              isLoading={neighborhoodQuery.isLoading}
              periodLabel={getPeriodLabel('week')}
            />
          </Suspense>
        </div>
      </section>

      <PagePanel density="default" className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight">
              Entregas do dia
            </h3>
            <p className="text-sm text-muted-foreground">
              Últimas entregas registradas
            </p>
          </div>
          <Link
            to="/entregas"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {deliveriesQuery.isLoading ? (
          <TableSkeleton rows={4} />
        ) : hasError ? (
          <EmptyState
            icon={<IconPackage className="size-6" />}
            title="API indisponível"
            description="Inicie o backend e o banco de dados para carregar os dados do dashboard."
            action={
              <button
                type="button"
                onClick={() => {
                  statsQuery.refetch()
                  deliveriesQuery.refetch()
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Tentar novamente
              </button>
            }
          />
        ) : (
          <TodayDeliveriesList
            deliveries={deliveries}
            showMotoboy={isAdmin && !motoboyId}
          />
        )}
      </PagePanel>
    </PageShell>
  )
}
