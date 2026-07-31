import { useState } from 'react'
import type { ReportPeriod } from '@/shared/types/api.types'
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

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('week')

  const summaryQuery = useReportSummary(period)
  const dailyBreakdownQuery = usePeriodDailyBreakdown(period)
  const neighborhoodQuery = useNeighborhoodReport(period, 8)
  const prestacaoTrendQuery = usePrestacaoTrend(period)

  const periodLabel = getPeriodLabel(period)
  const dailyBreakdown = dailyBreakdownQuery.data ?? []

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Indicadores, gráficos e detalhamento das prestações fechadas no
            período.
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </section>

      <ReportSummaryCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
      />

      <section className="grid gap-4 xl:grid-cols-2">
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

      <section className="grid gap-4 xl:grid-cols-2">
        <PrestacaoTrendChart
          data={prestacaoTrendQuery.data}
          isLoading={prestacaoTrendQuery.isLoading}
        />
        <DailyBreakdownTable data={dailyBreakdown} />
      </section>
    </div>
  )
}
