import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  MetaChip,
  MetaSectionTitle,
  PAGE_CARD_SECTION,
} from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { FormaPagamentoBadge } from '@/features/deliveries/components/FormaPagamentoBadge'
import type { StatusPagamentoCliente } from '@/features/deliveries/schemas/delivery.schema'
import type { PlannerStop, PrioridadeParada } from '../schemas/routing.schema'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { formatUrgentLabel } from '../utils/urgentPriority'
import { stopHasPaymentDetails } from '../utils/routeStopPayment'
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
  onPaymentStatusChange?: (
    stop: PlannerStop,
    status: StatusPagamentoCliente,
  ) => void
  paymentStatusUpdatingId?: string | null
  optimized?: boolean
  showStatusControls?: boolean
  deliveryStarted?: boolean
  reorderEnabled?: boolean
  orderDirty?: boolean
  nextStopTempId?: string | null
}

export function ListaEntregas({
  stops,
  onEdit,
  onRemove,
  onReorder,
  onStatusChange,
  onPaymentStatusChange,
  paymentStatusUpdatingId = null,
  optimized = false,
  showStatusControls = false,
  deliveryStarted = false,
  reorderEnabled = true,
  orderDirty = false,
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
    <Card glass className="min-w-0 overflow-hidden">
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
        <CardTitle>Lista de entregas ({stops.length})</CardTitle>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row">
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
      <CardContent className="min-w-0">
        {orderDirty ? (
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Ordem alterada. Recalcule a rota para atualizar distâncias e tempos.
          </p>
        ) : null}
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
              const enderecoLabel = [stop.endereco, stop.bairro]
                .filter(Boolean)
                .join(' — ')

              return (
                <div
                  key={stop.tempId}
                  draggable={reorderEnabled}
                  onDragStart={() => {
                    if (!reorderEnabled) return
                    setDragIndex(index)
                  }}
                  onDragOver={(event) => {
                    if (!reorderEnabled) return
                    event.preventDefault()
                  }}
                  onDrop={() => {
                    if (!reorderEnabled || dragIndex === null || dragIndex === index)
                      return
                    onReorder(dragIndex, index)
                    setDragIndex(null)
                  }}
                  className={cn(
                    'min-w-0 rounded-xl border bg-surface/30 p-3 sm:p-4',
                    colors.row,
                    reorderEnabled ? 'cursor-grab active:cursor-grabbing' : '',
                    isNext ? 'ring-2 ring-blue-500/40' : '',
                  )}
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {optimized || stop.ordem ? (
                          <Badge variant="default">
                            Parada{' '}
                            {String(stop.ordem ?? index + 1).padStart(2, '0')}
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
                          <MetaChip tone="imported">Do cadastro</MetaChip>
                        ) : null}
                        {isNext ? <Badge variant="default">Próxima</Badge> : null}
                      </div>

                      <MetaChip
                        tone="client"
                        className="max-w-full text-sm font-semibold"
                        title={stop.cliente ?? undefined}
                      >
                        {stop.cliente?.trim() || 'Sem nome'}
                      </MetaChip>

                      <MetaChip
                        tone="address"
                        className="w-full items-start whitespace-normal"
                      >
                        <span className="line-clamp-2 text-left leading-relaxed">
                          {enderecoLabel}
                        </span>
                      </MetaChip>

                      {stop.telefone ? (
                        <MetaChip tone="phone" className="tabular-nums">
                          {stop.telefone}
                        </MetaChip>
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
                        <MetaChip tone="time" className="w-fit">
                          {legMetrics.distancia != null
                            ? formatDistance(legMetrics.distancia)
                            : '—'}{' '}
                          ·{' '}
                          {legMetrics.tempo != null
                            ? formatDuration(legMetrics.tempo)
                            : '—'}
                        </MetaChip>
                      ) : null}

                      {stopHasPaymentDetails(stop) || stop.entregaId ? (
                        <div className={cn(PAGE_CARD_SECTION, 'mt-1')}>
                          <MetaSectionTitle tone="payment">
                            Pagamento
                          </MetaSectionTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            {stop.formaPagamento ? (
                              <FormaPagamentoBadge
                                value={stop.formaPagamento}
                                className="text-xs py-1"
                              />
                            ) : null}
                            {stop.valorProduto != null &&
                            !Number.isNaN(Number(stop.valorProduto)) ? (
                              <MetaChip
                                tone="product"
                                className="tabular-nums"
                              >
                                Produto:{' '}
                                {formatCurrency(Number(stop.valorProduto))}
                              </MetaChip>
                            ) : null}
                            {stop.valorEntrega != null &&
                            Number(stop.valorEntrega) > 0 ? (
                              <MetaChip tone="money" className="tabular-nums">
                                Corrida:{' '}
                                {formatCurrency(Number(stop.valorEntrega))}
                              </MetaChip>
                            ) : null}
                          </div>
                          {onPaymentStatusChange ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="text-xs text-muted-foreground">
                                Status:
                              </label>
                              <select
                                className="h-8 min-w-[8.5rem] rounded-lg border border-border/70 bg-surface/50 px-2 text-xs"
                                value={stop.statusPagamentoCliente ?? 'NAO_PAGO'}
                                disabled={
                                  paymentStatusUpdatingId === stop.tempId
                                }
                                onChange={(event) =>
                                  onPaymentStatusChange(
                                    stop,
                                    event.target.value as StatusPagamentoCliente,
                                  )
                                }
                              >
                                <option value="PAGO">Pago</option>
                                <option value="NAO_PAGO">Não pago</option>
                              </select>
                              <Badge
                                variant={
                                  stop.statusPagamentoCliente === 'PAGO'
                                    ? 'success'
                                    : 'warning'
                                }
                                className="text-[10px]"
                              >
                                {stop.statusPagamentoCliente === 'PAGO'
                                  ? 'Pago'
                                  : 'Não pago'}
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      {showStatusControls && onStatusChange ? (
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
                          variant="edit"
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
            {!reorderEnabled && optimized && !deliveryStarted ? (
              <p className="pt-1 text-xs text-muted-foreground">
                A ordem está protegida. Ative &quot;Permitir alterar ordem&quot; para
                reorganizar as paradas.
              </p>
            ) : null}
            {reorderEnabled ? (
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
