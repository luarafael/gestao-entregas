import {
  Badge,
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt, IconWhatsApp } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoDate } from '../schemas/prestacao.schema'
import type { PrestacaoHistoricoItem } from '../types/prestacaoCliente.types'

const tipoLabels = {
  empresa: { label: 'Empresa', variant: 'default' as const, tone: 'company' as const },
  motoboy: { label: 'Motoboy', variant: 'default' as const, tone: 'motoboy' as const },
  cliente: { label: 'Cliente', variant: 'default' as const, tone: 'client' as const },
}

const statusLabels = {
  ENVIADA: { label: 'Aguardando', variant: 'warning' as const },
  APROVADA: { label: 'Aprovada', variant: 'success' as const },
  REJEITADA: { label: 'Rejeitada', variant: 'danger' as const },
}

interface PrestacaoUnifiedHistoryProps {
  items: PrestacaoHistoricoItem[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCopy: (item: PrestacaoHistoricoItem) => void
  onSend?: (item: PrestacaoHistoricoItem) => void
  onExportPdf?: (item: PrestacaoHistoricoItem) => void
  onEdit?: (item: PrestacaoHistoricoItem) => void
  onDelete?: (item: PrestacaoHistoricoItem) => void
  copyingId?: string | null
  sendingId?: string | null
  deletingId?: string | null
}

export function PrestacaoUnifiedHistory({
  items,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onCopy,
  onSend,
  onExportPdf,
  onEdit,
  onDelete,
  copyingId,
  sendingId,
  deletingId,
}: PrestacaoUnifiedHistoryProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconReceipt className="size-6" />}
        title="Nenhuma prestação encontrada"
        description="Gere prestações para aparecer no histórico."
      />
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        {items.map((item) => {
          const tipo = tipoLabels[item.tipo]

          return (
            <article
              key={`${item.tipo}-${item.id}`}
              className={cn(PAGE_CARD_ARTICLE)}
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MetaField label="Data">
                  <MetaChip tone="time" className="w-fit">
                    {formatPrestacaoDate(item.data)}
                  </MetaChip>
                </MetaField>

                <MetaField label="Tipo">
                  <Badge variant={tipo.variant}>{tipo.label}</Badge>
                </MetaField>

                <MetaField label="Nome">
                  <MetaChip
                    tone={tipo.tone}
                    className="max-w-full"
                    title={item.titulo}
                  >
                    {item.titulo}
                  </MetaChip>
                  {item.subtitulo ? (
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      {item.subtitulo}
                    </p>
                  ) : null}
                </MetaField>

                <MetaField label="Entregas">
                  <MetaChip tone="delivery" className="w-fit tabular-nums">
                    {item.totalEntregas}
                  </MetaChip>
                </MetaField>

                <MetaField label="Valor final">
                  <MetaChip tone="money" className="w-fit tabular-nums">
                    {formatCurrency(item.valorFinal)}
                  </MetaChip>
                </MetaField>

                <MetaField label="Status">
                  {item.status ? (
                    <div className="space-y-1">
                      <Badge variant={statusLabels[item.status].variant}>
                        {statusLabels[item.status].label}
                      </Badge>
                      {item.motivoRejeicao ? (
                        <p className="text-xs font-normal text-danger">
                          {item.motivoRejeicao}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </MetaField>
              </div>

              <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
                {onEdit ? (
                  <Button variant="edit" size="sm" onClick={() => onEdit(item)}>
                    Editar
                  </Button>
                ) : null}
                {onExportPdf ? (
                  <Button
                    variant="pdf"
                    size="sm"
                    onClick={() => onExportPdf(item)}
                  >
                    PDF
                  </Button>
                ) : null}
                <Button
                  variant="copy"
                  size="sm"
                  onClick={() => onCopy(item)}
                  isLoading={copyingId === item.id}
                >
                  Copiar
                </Button>
                {onSend ? (
                  <Button
                    variant="whatsapp"
                    size="sm"
                    onClick={() => onSend(item)}
                    isLoading={sendingId === item.id}
                  >
                    <IconWhatsApp className="size-3.5" />
                    WhatsApp
                  </Button>
                ) : null}
                {(item.tipo === 'empresa' ||
                  item.tipo === 'cliente' ||
                  item.tipo === 'motoboy') &&
                onDelete ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(item)}
                    isLoading={deletingId === item.id}
                  >
                    Excluir
                  </Button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
