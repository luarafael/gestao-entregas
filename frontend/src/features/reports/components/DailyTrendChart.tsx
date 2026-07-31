import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyTrendPoint } from '@/shared/types/api.types'
import { formatCurrency } from '@/shared/utils/cn'
import { useChartTheme } from '../hooks/useChartTheme'
import { formatChartDate } from '../utils/chart.utils'
import { ChartCard } from './ChartCard'
import { ChartSkeleton } from './ChartSkeleton'

interface DailyTrendChartProps {
  data?: DailyTrendPoint[]
  isLoading?: boolean
  periodLabel?: string
}

export function DailyTrendChart({
  data = [],
  isLoading,
  periodLabel,
}: DailyTrendChartProps) {
  const theme = useChartTheme()

  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.date),
  }))

  if (isLoading) {
    return (
      <ChartCard
        title="Prestações por dia"
        description={
          periodLabel
            ? `Valores fechados em ${periodLabel.toLowerCase()}`
            : 'Valores fechados por prestação'
        }
      >
        <ChartSkeleton />
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Prestações por dia"
      description={
        periodLabel
          ? `Valores fechados em ${periodLabel.toLowerCase()}`
          : 'Valores fechados por prestação'
      }
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="entregas"
              allowDecimals={false}
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="valor"
              orientation="right"
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                borderRadius: '12px',
              }}
              labelStyle={{ color: theme.text }}
              formatter={(value, name) => {
                if (name === 'valor') {
                  return [formatCurrency(Number(value)), 'Valor final']
                }

                return [value, 'Entregas']
              }}
            />
            <Bar
              yAxisId="entregas"
              dataKey="entregas"
              fill={theme.primary}
              radius={[8, 8, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              yAxisId="valor"
              dataKey="valor"
              fill={theme.success}
              radius={[8, 8, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
