import type { DailyTrendPoint } from '@/shared/types/api.types'
import { formatCurrency } from '@/shared/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { formatChartDate } from '../utils/chart.utils'

interface DailyBreakdownTableProps {
  data: DailyTrendPoint[]
}

export function DailyBreakdownTable({ data }: DailyBreakdownTableProps) {
  if (data.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Detalhamento diário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium">Data</th>
                <th className="px-3 py-3 font-medium text-right">Entregas</th>
                <th className="px-3 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.date}
                  className="border-b border-border/40 transition-colors hover:bg-surface/40"
                >
                  <td className="px-3 py-3 font-medium">
                    {formatChartDate(row.date)}
                  </td>
                  <td className="px-3 py-3 text-right">{row.entregas}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatCurrency(row.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
