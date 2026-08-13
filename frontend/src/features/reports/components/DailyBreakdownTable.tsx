import { useState } from 'react'
import type { DailyTrendPoint } from '@/shared/types/api.types'
import type { DashboardScope } from '@/features/dashboard/types'
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
import type { ReportOrigemCadastro } from '../hooks/useReports'
import { DayDetailModal } from './DayDetailModal'

interface DailyBreakdownTableProps {
  scope?: DashboardScope
  data: DailyTrendPoint[]
  motoboyId?: string
  origemCadastro?: ReportOrigemCadastro
}

export function DailyBreakdownTable({
  scope = 'motoboy',
  data,
  motoboyId,
  origemCadastro,
}: DailyBreakdownTableProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const rows = data.filter((row) => row.temPrestacao)
  const emptyTitle =
    scope === 'cliente'
      ? 'Nenhum pedido no período'
      : scope === 'geral'
        ? 'Nenhum registro no período'
        : 'Nenhuma prestação no período'
  const emptyDescription =
    scope === 'cliente'
      ? 'Os pedidos entregues aparecerão aqui conforme forem registrados.'
      : scope === 'geral'
        ? 'Entregas motoboy e pedidos de clientes aparecerão aqui.'
        : 'Gere a prestação de contas para cada dia fechado.'

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
            title={emptyTitle}
            description={emptyDescription}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card glass className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Detalhamento diário
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="space-y-3">
            {rows.map((row) => (
              <button
                key={row.date}
                type="button"
                className={cn(
                  PAGE_CARD_ARTICLE,
                  'w-full min-w-0 cursor-pointer text-left transition-colors hover:border-primary/40 hover:bg-surface/40',
                )}
                onClick={() => setSelectedDate(row.date)}
                aria-label={`Ver entregas de ${formatChartDate(row.date)}`}
              >
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Toque para ver as entregas deste dia
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <DayDetailModal
        date={selectedDate}
        scope={scope}
        motoboyId={motoboyId}
        origemCadastro={origemCadastro}
        onClose={() => setSelectedDate(null)}
      />
    </>
  )
}
