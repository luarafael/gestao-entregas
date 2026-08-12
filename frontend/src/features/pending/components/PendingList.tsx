import {
  Badge,
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconClock } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { formatReferenteAoDia } from '../schemas/pending.schema'
import type { Pendencia } from '@/shared/types/api.types'

interface PendingListProps {
  items: Pendencia[]
  isLoading: boolean
  isFetching?: boolean
  onEdit: (item: Pendencia) => void
  onDelete: (item: Pendencia) => void
}

export function PendingList({
  items,
  isLoading,
  isFetching = false,
  onEdit,
  onDelete,
}: PendingListProps) {
  const isAdmin = useIsAdmin()

  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconClock className="size-6" />}
        title="Nenhuma pendência encontrada"
        description="Cadastre uma nova pendência ou ajuste os filtros."
      />
    )
  }

  return (
    <div
      className={cn(
        'min-w-0 space-y-3 transition-opacity',
        isFetching && 'opacity-60',
      )}
    >
      {items.map((item) => (
        <article key={item.id} className={cn(PAGE_CARD_ARTICLE)}>
          <div
            className={cn(
              'grid min-w-0 gap-3 sm:grid-cols-2',
              isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
            )}
          >
            <MetaField label="Descrição" className="sm:col-span-2">
              <p className="text-sm font-medium leading-snug">{item.descricao}</p>
            </MetaField>

            {isAdmin ? (
              <MetaField label="Motoboy">
                <MetaChip
                  tone="motoboy"
                  className="max-w-full"
                  title={item.motoboy?.nome ?? undefined}
                >
                  {item.motoboy?.nome ?? '—'}
                </MetaChip>
              </MetaField>
            ) : null}

            <MetaField label="Referente ao dia">
              <MetaChip tone="time" className="w-fit">
                {formatReferenteAoDia(item.referenteAoDia)}
              </MetaChip>
            </MetaField>

            <MetaField label="Valor">
              <MetaChip tone="money" className="w-fit tabular-nums">
                {formatCurrency(Number(item.valor))}
              </MetaChip>
            </MetaField>

            <MetaField label="Status">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={item.status === 'RECEBIDO' ? 'success' : 'warning'}
                >
                  {item.status === 'RECEBIDO' ? 'Pago' : 'Pendente'}
                </Badge>
                {isAdmin && item.tipo === 'REPASSE_MOTOBOY' ? (
                  <MetaChip tone="pending">Repasse motoboy</MetaChip>
                ) : null}
              </div>
            </MetaField>
          </div>

          {item.status === 'PENDENTE' || isAdmin ? (
            <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
              <Button variant="edit" size="sm" onClick={() => onEdit(item)}>
                Editar
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(item)}>
                Excluir
              </Button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
