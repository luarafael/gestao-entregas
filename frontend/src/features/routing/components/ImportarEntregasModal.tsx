import { useMemo, useState } from 'react'
import {
  Button,
  Input,
  Modal,
  TableSkeleton,
} from '@/shared/components/ui'
import { useDeliveries } from '@/features/deliveries/hooks/useDeliveries'
import { useDebounce } from '@/shared/hooks'
import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR } from '@/shared/utils/format'
import type { Entrega } from '@/shared/types/api.types'
import type { DateFilter } from '@/features/deliveries/schemas/delivery.schema'
import { createPlannerStop } from '../utils/parseAddresses'
import type { PlannerStop } from '../schemas/routing.schema'

interface ImportarEntregasModalProps {
  open: boolean
  onClose: () => void
  onImport: (stops: PlannerStop[]) => void
  existingEntregaIds: Set<string>
}

export function ImportarEntregasModal({
  open,
  onClose,
  onImport,
  existingEntregaIds,
}: ImportarEntregasModalProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<DateFilter>('today')
  const [bairro, setBairro] = useState('')
  const [status, setStatus] = useState<'ALL' | Entrega['status']>('ALL')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useDeliveries({
    page: 1,
    limit: 100,
    search: debouncedSearch,
    filter,
    sortBy: 'horario',
    sortOrder: 'desc',
  })

  const deliveries = useMemo(() => {
    const list = data?.data ?? []
    return list.filter((delivery) => {
      if (existingEntregaIds.has(delivery.id)) return false
      if (status !== 'ALL' && delivery.status !== status) return false
      if (
        bairro &&
        !delivery.bairro.toLowerCase().includes(bairro.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [bairro, data?.data, existingEntregaIds, status])

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImport = () => {
    const stops = deliveries
      .filter((delivery) => selected.has(delivery.id))
      .map((delivery) =>
        createPlannerStop({
          entregaId: delivery.id,
          cliente: delivery.nomeCliente,
          endereco: [
            delivery.endereco,
            delivery.bairro,
            delivery.cidade,
          ]
            .filter(Boolean)
            .join(' - '),
          bairro: delivery.bairro,
          observacao: delivery.observacao,
          valorEntrega: Number(delivery.valorEntrega),
        }),
      )

    onImport(stops)
    setSelected(new Set())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar entregas cadastradas"
      description="Selecione entregas do módulo Entregas. Remover do planejador não exclui o cadastro original."
      className="max-h-[85vh] max-w-3xl overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Cliente ou endereço"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Input
            placeholder="Filtrar bairro"
            value={bairro}
            onChange={(event) => setBairro(event.target.value)}
          />
          <select
            className="h-10 rounded-xl border border-border/70 bg-surface/50 px-3 text-sm"
            value={filter}
            onChange={(event) => setFilter(event.target.value as DateFilter)}
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </select>
          <select
            className="h-10 rounded-xl border border-border/70 bg-surface/50 px-3 text-sm"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as 'ALL' | Entrega['status'])
            }
          >
            <option value="ALL">Todos status</option>
            <option value="ENTREGUE">Entregue</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setSelected(new Set(deliveries.map((delivery) => delivery.id)))
            }
          >
            Selecionar todas
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Desmarcar todas
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma entrega disponível para importar com esses filtros.
              </p>
            ) : (
              deliveries.map((delivery) => (
                <label
                  key={delivery.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-surface/20 p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={selected.has(delivery.id)}
                    onChange={() => toggle(delivery.id)}
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">
                      {delivery.nomeCliente || 'Sem nome'}
                    </p>
                    <p className="text-muted-foreground">
                      {delivery.endereco} — {delivery.bairro}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(delivery.data)} · {delivery.status} ·{' '}
                      {formatCurrency(Number(delivery.valorEntrega))}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={selected.size === 0}>
            Adicionar ao planejamento ({selected.size})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
