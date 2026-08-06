import { useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import type { PlannerStop, PrioridadeParada } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { formatUrgentLabel } from '../utils/urgentPriority'

interface ListaEntregasProps {
  stops: PlannerStop[]
  onEdit: (stop: PlannerStop) => void
  onRemove: (tempId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  optimized?: boolean
}

export function ListaEntregas({
  stops,
  onEdit,
  onRemove,
  onReorder,
  optimized = false,
}: ListaEntregasProps) {
  const [search, setSearch] = useState('')
  const [prioridade, setPrioridade] = useState<'ALL' | PrioridadeParada>('ALL')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const filtered = stops.filter((stop) => {
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      stop.endereco.toLowerCase().includes(term) ||
      (stop.cliente?.toLowerCase().includes(term) ?? false) ||
      (stop.bairro?.toLowerCase().includes(term) ?? false)
    const matchesPriority =
      prioridade === 'ALL' || stop.prioridade === prioridade
    return matchesSearch && matchesPriority
  })

  return (
    <Card glass>
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
        <CardTitle>Lista de entregas ({stops.length})</CardTitle>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Input
            placeholder="Cliente, bairro ou endereço"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-56"
          />
          <select
            className="h-10 rounded-xl border border-border/70 bg-surface/50 px-3 text-sm"
            value={prioridade}
            onChange={(event) =>
              setPrioridade(event.target.value as 'ALL' | PrioridadeParada)
            }
          >
            <option value="ALL">Todas prioridades</option>
            <option value="NORMAL">Normal</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconPackage className="size-6" />}
            title="Nenhuma entrega no planejamento"
            description="Importe entregas cadastradas, adicione manualmente ou cole uma lista."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((stop) => {
              const index = stops.findIndex((item) => item.tempId === stop.tempId)
              return (
                <div
                  key={stop.tempId}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return
                    onReorder(dragIndex, index)
                    setDragIndex(null)
                  }}
                  className="cursor-grab rounded-xl border border-border/50 bg-surface/30 p-3 active:cursor-grabbing"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {optimized || stop.ordem ? (
                          <Badge variant="default">
                            Parada {stop.ordem ?? index + 1}
                          </Badge>
                        ) : null}
                        {stop.prioridade === 'URGENTE' ? (
                          <Badge variant="warning">
                            {formatUrgentLabel(stop.ordemUrgencia)}
                          </Badge>
                        ) : null}
                        {stop.entregaId ? (
                          <Badge variant="success">Do cadastro</Badge>
                        ) : null}
                      </div>
                      <p className="font-medium">
                        {stop.cliente?.trim() || 'Sem nome'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stop.endereco}
                      </p>
                      {stop.observacao ? (
                        <p className="text-xs text-muted-foreground">
                          {stop.observacao}
                        </p>
                      ) : null}
                      {stop.distancia != null || stop.tempo != null ? (
                        <p className="text-xs text-muted-foreground">
                          {stop.distancia != null
                            ? formatDistance(stop.distancia)
                            : '—'}{' '}
                          ·{' '}
                          {stop.tempo != null
                            ? formatDuration(stop.tempo)
                            : '—'}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(stop)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onRemove(stop.tempId)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            <p className="pt-1 text-xs text-muted-foreground">
              Arraste os itens para reordenar a rota manualmente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
