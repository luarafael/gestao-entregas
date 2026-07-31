import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { NeighborhoodReportPoint } from '@/shared/types/api.types'
import { formatCurrency } from '@/shared/utils/cn'
import { useChartTheme } from '../hooks/useChartTheme'
import { ChartCard } from './ChartCard'
import { ChartSkeleton } from './ChartSkeleton'

interface NeighborhoodChartProps {
  data?: NeighborhoodReportPoint[]
  isLoading?: boolean
  periodLabel: string
}

export function NeighborhoodChart({
  data = [],
  isLoading,
  periodLabel,
}: NeighborhoodChartProps) {
  const theme = useChartTheme()

  if (isLoading) {
    return (
      <ChartCard
        title="Entregas por bairro"
        description={`Principais bairros — ${periodLabel}`}
      >
        <ChartSkeleton />
      </ChartCard>
    )
  }

  if (data.length === 0) {
    return (
      <ChartCard
        title="Entregas por bairro"
        description={`Principais bairros — ${periodLabel}`}
      >
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nenhuma entrega registrada no período.
        </p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Entregas por bairro"
      description={`Principais bairros — ${periodLabel}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="bairro"
              width={96}
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                borderRadius: '12px',
              }}
              formatter={(value, name) => {
                if (name === 'valor') {
                  return [formatCurrency(Number(value)), 'Valor']
                }

                return [value, 'Entregas']
              }}
            />
            <Bar
              dataKey="entregas"
              fill={theme.primary}
              radius={[0, 8, 8, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
