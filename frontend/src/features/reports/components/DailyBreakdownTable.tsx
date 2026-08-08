import type { DailyTrendPoint } from '@/shared/types/api.types'
import { formatCurrency } from '@/shared/utils/cn'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { formatChartDate } from '../utils/chart.utils'

interface DailyBreakdownTableProps {
  data: DailyTrendPoint[]
}

export function DailyBreakdownTable({ data }: DailyBreakdownTableProps) {
  const rows = data.filter((row) => row.temPrestacao)

  if (rows.length === 0) {
    return (
      <Card glass className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Detalhamento diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<IconReceipt className="size-6" />}
            title="Nenhuma prestação no período"
            description="Gere a prestação de contas para cada dia fechado."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card glass className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Detalhamento diário
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.date} className={cn(PAGE_CARD_ARTICLE, 'min-w-0')}>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                <MetaField label="Data">
                  <MetaChip tone="time" className="w-fit tabular-nums">
                    {formatChartDate(row.date)}
                  </MetaChip>
                </MetaField>

                <MetaField label="Entregas">
                  <MetaChip tone="delivery" className="w-fit tabular-nums">
                    {row.entregas}
                  </MetaChip>
                </MetaField>

                <MetaField label="Valor final">
                  <MetaChip tone="money" className="w-fit tabular-nums">
                    {formatCurrency(row.valor)}
                  </MetaChip>
                </MetaField>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
