import { useState } from 'react'
import type { ReportPeriod } from '@/shared/types/api.types'
import { Button, PageShell } from '@/shared/components/ui'
import { ScopeToggle } from '@/shared/components/ScopeToggle'
import {
  MotoboySelect,
  type MotoboySelectValue,
} from '@/shared/components/MotoboySelect'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  dashboardScopeToReportOrigem,
  getReportScopeDescription,
  getReportScopeLabel,
  type DashboardScope,
} from '@/features/dashboard/types'
import {
  useNeighborhoodReport,
  usePeriodDailyBreakdown,
  usePrestacaoTrend,
  useReportSummary,
} from '../hooks/useReports'
import { DailyBreakdownTable } from '../components/DailyBreakdownTable'
import { DailyTrendChart } from '../components/DailyTrendChart'
import { NeighborhoodChart } from '../components/NeighborhoodChart'
import { PeriodFilter } from '../components/PeriodFilter'
import { PrestacaoTrendChart } from '../components/PrestacaoTrendChart'
import { ReportSummaryCards } from '../components/ReportSummaryCards'
import { getPeriodLabel } from '../utils/chart.utils'
import { exportReportPdf } from '../utils/exportReportPdf'
import { toast } from '@/shared/stores/toast.store'

export function ReportsPage() {
  const isAdmin = useIsAdmin()
  const userId = useAuthStore((state) => state.user?.id)
  const [period, setPeriod] = useState<ReportPeriod>('week')
  const [reportScope, setReportScope] = useState<DashboardScope>('motoboy')
  const [motoboyFilter, setMotoboyFilter] =
    useState<MotoboySelectValue>('all')

  const effectiveScope: DashboardScope = isAdmin ? reportScope : 'motoboy'
  const reportOrigem = dashboardScopeToReportOrigem(effectiveScope)
  const showPrestacaoTrend = effectiveScope === 'motoboy'

  const motoboyId =
    effectiveScope === 'motoboy'
      ? isAdmin
        ? motoboyFilter === 'all'
          ? undefined
          : motoboyFilter
        : userId
      : undefined

  const queriesEnabled = isAdmin || Boolean(userId)

  const summaryQuery = useReportSummary(
    period,
    motoboyId,
    queriesEnabled,
    reportOrigem,
  )
  const dailyBreakdownQuery = usePeriodDailyBreakdown(
    period,
    motoboyId,
    queriesEnabled,
    reportOrigem,
  )
  const neighborhoodQuery = useNeighborhoodReport(
    period,
    8,
    motoboyId,
    queriesEnabled,
    reportOrigem,
  )
  const prestacaoTrendQuery = usePrestacaoTrend(
    period,
    motoboyId,
    queriesEnabled && showPrestacaoTrend,
    reportOrigem,
  )

  const periodLabel = getPeriodLabel(period)
  const dailyBreakdown = dailyBreakdownQuery.data ?? []
  const canExportPdf =
    Boolean(summaryQuery.data) &&
    !summaryQuery.isLoading &&
    !dailyBreakdownQuery.isLoading &&
    !neighborhoodQuery.isLoading

  const scopeLabel = getReportScopeLabel(
    effectiveScope,
    isAdmin,
    Boolean(motoboyId),
  )

  const handleExportPdf = () => {
    if (!summaryQuery.data) return

    exportReportPdf({
      period,
      summary: summaryQuery.data,
      dailyBreakdown,
      neighborhoods: neighborhoodQuery.data ?? [],
      scopeLabel,
      scope: effectiveScope,
    })
    toast('PDF exportado com sucesso', 'success')
  }

  return (
    <PageShell>
      <section className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            {getReportScopeDescription(
              effectiveScope,
              isAdmin,
              Boolean(motoboyId),
            )}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          {isAdmin ? (
            <ScopeToggle value={reportScope} onChange={setReportScope} />
          ) : null}
          {isAdmin && effectiveScope === 'motoboy' ? (
            <MotoboySelect
              id="reports-motoboy"
              value={motoboyFilter}
              onChange={setMotoboyFilter}
              allowAll
              label="Motoboy"
            />
          ) : null}
          <Button
            variant="pdf"
            onClick={handleExportPdf}
            disabled={!canExportPdf}
          >
            Exportar PDF
          </Button>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>
      </section>

      <ReportSummaryCards
        scope={effectiveScope}
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
      />

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <DailyTrendChart
          data={dailyBreakdown}
          isLoading={dailyBreakdownQuery.isLoading}
          periodLabel={periodLabel}
        />
        <NeighborhoodChart
          data={neighborhoodQuery.data}
          isLoading={neighborhoodQuery.isLoading}
          periodLabel={periodLabel}
        />
      </section>

      <section
        className={
          showPrestacaoTrend
            ? 'grid min-w-0 gap-4 xl:grid-cols-2'
            : 'grid min-w-0 gap-4'
        }
      >
        {showPrestacaoTrend ? (
          <PrestacaoTrendChart
            data={prestacaoTrendQuery.data}
            isLoading={prestacaoTrendQuery.isLoading}
          />
        ) : null}
        <DailyBreakdownTable scope={effectiveScope} data={dailyBreakdown} />
      </section>
    </PageShell>
  )
}
