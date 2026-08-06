import { Badge, Button, DataTable } from '@/shared/components/ui'
import { IconUsers } from '@/shared/components/icons'
import { formatDateBR } from '@/shared/utils/format'
import type { Motoboy } from '../types'

interface MotoboyTableProps {
  items: Motoboy[]
  isLoading: boolean
  isFetching?: boolean
  onEdit: (item: Motoboy) => void
  onToggleAtivo: (item: Motoboy) => void
}

export function MotoboyTable({
  items,
  isLoading,
  isFetching = false,
  onEdit,
  onToggleAtivo,
}: MotoboyTableProps) {
  return (
    <DataTable
      data={items}
      rowKey={(item) => item.id}
      minWidthClass="min-w-170"
      isLoading={isLoading}
      isFetching={isFetching}
      emptyState={{
        icon: <IconUsers className="size-6" />,
        title: 'Nenhum motoboy encontrado',
        description: 'Crie um funcionário ou ajuste os filtros.',
      }}
      columns={[
        {
          key: 'nome',
          header: 'Nome',
          cellClassName: 'font-medium',
          render: (item) => item.nome,
        },
        {
          key: 'email',
          header: 'E-mail',
          cellClassName: 'text-muted-foreground',
          render: (item) => item.email,
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <Badge variant={item.ativo ? 'success' : 'danger'}>
              {item.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          ),
        },
        {
          key: 'criadoEm',
          header: 'Criado em',
          cellClassName: 'text-muted-foreground',
          render: (item) => formatDateBR(item.criadoEm),
        },
        {
          key: 'acoes',
          header: 'Ações',
          headerClassName: 'text-right',
          render: (item) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                Editar
              </Button>
              <Button
                variant={item.ativo ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => onToggleAtivo(item)}
              >
                {item.ativo ? 'Desativar' : 'Reativar'}
              </Button>
            </div>
          ),
        },
      ]}
    />
  )
}
