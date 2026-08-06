import { useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import type { PlannerStop, PrioridadeParada } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { formatUrgentLabel } from '../utils/urgentPriority'
import {
  STATUS_COLORS,
  STATUS_EXECUCAO_OPTIONS,
  STATUS_LABELS,
  getStopLegMetrics,
  getStopStatus,
  type StatusExecucao,
} from '../utils/executionStatus'

interface ListaEntregasProps {
  stops: PlannerStop[]
  onEdit: (stop: PlannerStop) => void
  onRemove: (tempId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onStatusChange?: (
    stop: PlannerStop,
    status: StatusExecucao,
    observacao?: string | null,
  ) => void
  optimized?: boolean
  executionMode?: boolean
  nextStopTempId?: string | null
}

export function ListaEntregas({
  stops,
  onEdit,
  onRemove,
  onReorder,
  onStatusChange,
  optimized = false,
  executionMode = false,
  nextStopTempId,
}: ListaEntregasProps) {
  const [search, setSearch] = useState('')
  const [prioridade, setPrioridade] = useState<'ALL' | PrioridadeParada>('ALL')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [observacaoTempId, setObservacaoTempId] = useState<string | null>(null)
  const [observacaoText, setObservacaoText] = useState('')
  const [pendingStatus, setPendingStatus] = useState<StatusExecucao | null>(null)

  const filtered = stops.filter((stop) => {
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      stop.endereco.toLowerCase().includes(term) ||
      (stop.cliente?.toLowerCase().includes(term) ?? false) ||
      (stop.bairro?.toLowerCase().includes(term) ?? false) ||
      (stop.telefone?.toLowerCase().includes(term) ?? false)
    const matchesPriority =
      prioridade === 'ALL' || stop.prioridade === prioridade
    return matchesSearch && matchesPriority
  })

  const handleStatusSelect = (stop: PlannerStop, status: StatusExecucao) => {
    if (
      status === 'CLIENTE_AUSENTE' ||
      status === 'NAO_LOCALIZADO' ||
      status === 'FALHA_ENTREGA' ||
      status === 'CANCELADA'
    ) {
      setPendingStatus(status)
      setObservacaoTempId(stop.tempId)
      setObservacaoText(stop.statusObservacao ?? '')
      return
    }

    onStatusChange?.(stop, status)
  }

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
              const status = getStopStatus(stop)
              const legMetrics = getStopLegMetrics(stop)
              const colors = STATUS_COLORS[status]
              const isNext = stop.tempId === nextStopTempId

              return (
                <div
                  key={stop.tempId}
                  draggable={!executionMode}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return
                    onReorder(dragIndex, index)
                    setDragIndex(null)
                  }}
                  className={`rounded-xl border bg-surface/30 p-3 ${colors.row} ${
                    executionMode ? '' : 'cursor-grab active:cursor-grabbing'
                  } ${isNext ? 'ring-2 ring-blue-500/40' : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {optimized || stop.ordem ? (
                          <Badge variant="default">
                            Parada {String(stop.ordem ?? index + 1).padStart(2, '0')}
                          </Badge>
                        ) : null}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors.badge}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                        {stop.prioridade === 'URGENTE' ? (
                          <Badge variant="warning">
                            {formatUrgentLabel(stop.ordemUrgencia)}
                          </Badge>
                        ) : null}
                        {stop.entregaId ? (
                          <Badge variant="success">Do cadastro</Badge>
                        ) : null}
                        {isNext ? (
                          <Badge variant="default">Próxima</Badge>
                        ) : null}
                      </div>
                      <p className="font-medium">
                        {stop.cliente?.trim() || 'Sem nome'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stop.endereco}
                      </p>
                      {stop.bairro ? (
                        <p className="text-sm text-muted-foreground">
                          Bairro: {stop.bairro}
                        </p>
                      ) : null}
                      {stop.telefone ? (
                        <p className="text-sm text-muted-foreground">
                          Telefone: {stop.telefone}
                        </p>
                      ) : null}
                      {stop.observacao ? (
                        <p className="text-xs text-muted-foreground">
                          {stop.observacao}
                        </p>
                      ) : null}
                      {stop.statusObservacao ? (
                        <p className="text-xs text-amber-300/90">
                          Status: {stop.statusObservacao}
                        </p>
                      ) : null}
                      {legMetrics.distancia != null || legMetrics.tempo != null ? (
                        <p className="text-xs text-muted-foreground">
                          {legMetrics.distancia != null
                            ? formatDistance(legMetrics.distancia)
                            : '—'}{' '}
                          ·{' '}
                          {legMetrics.tempo != null
                            ? formatDuration(legMetrics.tempo)
                            : '—'}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {executionMode && onStatusChange ? (
                        <select
                          className="h-9 min-w-40 rounded-xl border border-border/70 bg-surface/50 px-2 text-sm"
                          value={status}
                          onChange={(event) =>
                            handleStatusSelect(
                              stop,
                              event.target.value as StatusExecucao,
                            )
                          }
                        >
                          {STATUS_EXECUCAO_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
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

                  {observacaoTempId === stop.tempId ? (
                    <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                      <Input
                        label="Observação do status"
                        value={observacaoText}
                        onChange={(event) =>
                          setObservacaoText(event.target.value)
                        }
                        placeholder="Ex: cliente ausente, portaria fechada..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!pendingStatus) return
                            onStatusChange?.(
                              stop,
                              pendingStatus,
                              observacaoText || null,
                            )
                            setObservacaoTempId(null)
                            setObservacaoText('')
                            setPendingStatus(null)
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setObservacaoTempId(null)
                            setObservacaoText('')
                            setPendingStatus(null)
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
            {!executionMode ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Arraste os itens para reordenar a rota manualmente.
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
