import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PrestacaoTrendPoint } from '@/shared/types/api.types'
import { formatCurrency } from '@/shared/utils/cn'
import { useChartTheme } from '../hooks/useChartTheme'
import { formatChartDate } from '../utils/chart.utils'
import { ChartCard } from './ChartCard'
import { ChartSkeleton } from './ChartSkeleton'

interface PrestacaoTrendChartProps {
  data?: PrestacaoTrendPoint[]
  isLoading?: boolean
}

export function PrestacaoTrendChart({
  data = [],
  isLoading,
}: PrestacaoTrendChartProps) {
  const theme = useChartTheme()

  const chartData = data.map((point) => ({
    ...point,
    label: formatChartDate(point.date),
  }))

  if (isLoading) {
    return (
      <ChartCard
        title="Histórico de prestações"
        description="Valor final fechado por dia"
      >
        <ChartSkeleton />
      </ChartCard>
    )
  }

  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Histórico de prestações"
        description="Valor final fechado por dia"
      >
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nenhuma prestação gerada no período.
        </p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Histórico de prestações"
      description="Valor final fechado por dia"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
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
              formatter={(value, name) => {
                if (name === 'valorFinal') {
                  return [formatCurrency(Number(value)), 'Valor final']
                }

                return [value, 'Entregas']
              }}
            />
            <Line
              type="monotone"
              dataKey="valorFinal"
              stroke={theme.warning}
              strokeWidth={3}
              dot={{ fill: theme.warning, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
