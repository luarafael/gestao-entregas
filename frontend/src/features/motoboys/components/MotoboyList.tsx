import {
  Badge,
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconUsers } from '@/shared/components/icons'
import { ProfileAvatar } from '@/features/auth/components/ProfileAvatar'
import { cn } from '@/shared/utils/cn'
import { formatDateBR } from '@/shared/utils/format'
import type { Motoboy } from '../types'

interface MotoboyListProps {
  items: Motoboy[]
  isLoading: boolean
  isFetching?: boolean
  onEdit: (item: Motoboy) => void
  onToggleAtivo: (item: Motoboy) => void
  onDelete: (item: Motoboy) => void
}

export function MotoboyList({
  items,
  isLoading,
  isFetching = false,
  onEdit,
  onToggleAtivo,
  onDelete,
}: MotoboyListProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconUsers className="size-6" />}
        title="Nenhum motoboy encontrado"
        description="Crie um funcionário ou ajuste os filtros."
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
        <article key={item.id} className={cn(PAGE_CARD_ARTICLE, 'min-w-0')}>
          <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto_minmax(0,0.9fr)]">
            <MetaField label="Nome" className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <ProfileAvatar
                  userId={item.id}
                  nome={item.nome}
                  fotoUrl={item.fotoPerfil}
                  size="sm"
                />
                <MetaChip tone="motoboy" className="min-w-0 max-w-full" title={item.nome}>
                  {item.nome}
                </MetaChip>
              </div>
            </MetaField>

            <MetaField label="E-mail" className="min-w-0">
              <p
                className="truncate text-sm font-medium text-foreground"
                title={item.email}
              >
                {item.email}
              </p>
            </MetaField>

            <MetaField label="Status" className="min-w-0">
              <Badge variant={item.ativo ? 'success' : 'danger'} className="w-fit">
                {item.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </MetaField>

            <MetaField label="Criado em" className="min-w-0">
              <MetaChip tone="time" className="w-fit max-w-full">
                {formatDateBR(item.criadoEm)}
              </MetaChip>
            </MetaField>
          </div>

          <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
            <Button variant="edit" size="sm" onClick={() => onEdit(item)}>
              Editar
            </Button>
            <Button
              variant={item.ativo ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => onToggleAtivo(item)}
            >
              {item.ativo ? 'Desativar' : 'Reativar'}
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(item)}>
              Excluir
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
