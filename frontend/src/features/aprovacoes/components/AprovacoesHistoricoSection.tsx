import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  Pagination,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import { usePrestacoesHistorico } from '../hooks/useAprovacoes'

const statusConfig = {
  APROVADA: { label: 'Aprovada', variant: 'success' as const },
  REJEITADA: { label: 'Rejeitada', variant: 'danger' as const },
}

interface AprovacoesHistoricoSectionProps {
  motoboyId?: string
  page: number
  onPageChange: (page: number) => void
}

export function AprovacoesHistoricoSection({
  motoboyId,
  page,
  onPageChange,
}: AprovacoesHistoricoSectionProps) {
  const historyQuery = usePrestacoesHistorico(motoboyId, page)
  const items = historyQuery.data?.data ?? []
  const meta = historyQuery.data?.meta

  if (historyQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-24 animate-pulse rounded-xl bg-surface/50" />
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconReceipt className="size-6" />}
        title="Nenhuma aprovação no histórico"
        description="Prestações aprovadas ou rejeitadas aparecerão aqui."
      />
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const config =
          item.status === 'APROVADA' || item.status === 'REJEITADA'
            ? statusConfig[item.status]
            : null

        const resolvedAt = item.aprovadaEm ?? item.rejeitadaEm

        return (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">
                      {item.motoboy?.nome ?? 'Motoboy'}
                    </p>
                    {config ? (
                      <Badge variant={config.variant}>{config.label}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prestação de {formatPrestacaoMotoboyDate(item.data)} ·{' '}
                    {item.totalEntregas} entregas
                  </p>
                  <p className="mt-2 text-sm">
                    Total:{' '}
                    <span className="font-semibold text-primary">
                      {formatCurrency(Number(item.valorFinal))}
                    </span>
                  </p>
                  {item.status === 'REJEITADA' && item.motivoRejeicao ? (
                    <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      Motivo: {item.motivoRejeicao}
                    </p>
                  ) : null}
                </div>

                {resolvedAt ? (
                  <div className="text-sm text-muted-foreground sm:text-right">
                    <p>{formatDateBR(resolvedAt)}</p>
                    <p>{formatTimeBR(resolvedAt)}</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {meta && meta.totalPages > 1 ? (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  )
}
