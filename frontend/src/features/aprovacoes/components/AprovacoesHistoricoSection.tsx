import {
  Badge,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
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
    return <TableSkeleton rows={4} />
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
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        {items.map((item) => {
          const config =
            item.status === 'APROVADA' || item.status === 'REJEITADA'
              ? statusConfig[item.status]
              : null

          const resolvedAt = item.aprovadaEm ?? item.rejeitadaEm

          return (
            <article key={item.id} className={cn(PAGE_CARD_ARTICLE, 'min-w-0')}>
              <div className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MetaField label="Motoboy" className="min-w-0">
                  <MetaChip
                    tone="motoboy"
                    className="w-full max-w-full"
                    title={item.motoboy?.nome ?? undefined}
                  >
                    {item.motoboy?.nome ?? 'Motoboy'}
                  </MetaChip>
                </MetaField>

                <MetaField label="Prestação de">
                  <MetaChip tone="time" className="w-fit">
                    {formatPrestacaoMotoboyDate(item.data)}
                  </MetaChip>
                </MetaField>

                <MetaField label="Entregas">
                  <MetaChip tone="delivery" className="w-fit tabular-nums">
                    {item.totalEntregas}
                  </MetaChip>
                </MetaField>

                <MetaField label="Total">
                  <MetaChip tone="motoboyFee" className="w-fit tabular-nums">
                    {formatCurrency(Number(item.valorFinal))}
                  </MetaChip>
                </MetaField>

                <MetaField label="Status">
                  {config ? (
                    <Badge variant={config.variant}>{config.label}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </MetaField>

                <MetaField label="Decisão em">
                  {resolvedAt ? (
                    <MetaChip tone="time" className="w-fit max-w-full">
                      {formatDateBR(resolvedAt)} · {formatTimeBR(resolvedAt)}
                    </MetaChip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </MetaField>
              </div>

              {item.status === 'REJEITADA' && item.motivoRejeicao ? (
                <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  Motivo: {item.motivoRejeicao}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>

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
