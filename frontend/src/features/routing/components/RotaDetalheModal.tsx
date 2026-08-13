import {
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  Modal,
  PAGE_CARD_ARTICLE,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconRoute } from '@/shared/components/icons'
import { formatCurrency, cn } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { formatDistance, formatDuration } from '../utils/googleMapsUrl'
import { STATUS_LABELS, type StatusExecucao } from '../utils/executionStatus'
import { useRouteDetail } from '../hooks/useRouting'

interface RotaDetalheModalProps {
  rotaId: string | null
  onClose: () => void
}

export function RotaDetalheModal({ rotaId, onClose }: RotaDetalheModalProps) {
  const detailQuery = useRouteDetail(rotaId)
  const rota = detailQuery.data?.rota
  const execucoes = detailQuery.data?.execucoes ?? []
  const statusByParadaId = new Map(
    execucoes
      .filter((item) => item.paradaId)
      .map((item) => [item.paradaId as string, item]),
  )

  return (
    <Modal
      open={Boolean(rotaId)}
      onClose={onClose}
      title={
        rota ? `Rota de ${formatDateBR(rota.data)}` : 'Detalhe da rota'
      }
      description="Paradas, valores, distância e status registrados nesta rota."
      className="max-w-2xl"
    >
      {detailQuery.isLoading ? (
        <TableSkeleton rows={4} />
      ) : !rota ? (
        <EmptyState
          icon={<IconRoute className="size-6" />}
          title="Rota não encontrada"
          description="Não foi possível carregar os detalhes desta rota."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <MetaField label="Paradas">
              <MetaChip tone="delivery" className="w-fit tabular-nums">
                {rota.paradas.length}
              </MetaChip>
            </MetaField>
            <MetaField label="Trajeto">
              <MetaChip tone="time" className="w-fit tabular-nums">
                {formatDistance(Number(rota.distanciaTotal))} ·{' '}
                {formatDuration(rota.tempoTotal)}
                {rota.aproximada ? ' · aproximada' : ''}
              </MetaChip>
            </MetaField>
            {rota.concluidaEm ? (
              <MetaField label="Concluída">
                <MetaChip tone="delivery" className="w-fit">
                  {formatDateBR(rota.concluidaEm)} ·{' '}
                  {formatTimeBR(rota.concluidaEm)}
                </MetaChip>
              </MetaField>
            ) : null}
            <MetaField label="Partida" className="sm:col-span-2">
              <MetaChip
                tone="address"
                className="w-full items-start whitespace-normal"
              >
                <span className="text-left leading-relaxed">
                  {rota.enderecoInicial}
                </span>
              </MetaChip>
            </MetaField>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Paradas
            </p>
            {rota.paradas.map((parada) => {
              const execucao = statusByParadaId.get(parada.id)
              const status = execucao?.status as StatusExecucao | undefined
              const endereco = [parada.endereco, parada.bairro]
                .filter(Boolean)
                .join(' — ')

              return (
                <article
                  key={parada.id}
                  className={cn(PAGE_CARD_ARTICLE, 'min-w-0 space-y-3')}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <MetaChip tone="delivery" className="w-fit tabular-nums">
                      #{parada.ordem}
                    </MetaChip>
                    {parada.prioridade === 'URGENTE' ? (
                      <MetaChip tone="pending">Urgente</MetaChip>
                    ) : null}
                    {status ? (
                      <MetaChip tone="imported">
                        {STATUS_LABELS[status] ?? status}
                      </MetaChip>
                    ) : null}
                  </div>

                  <MetaChip
                    tone="client"
                    className="max-w-full text-sm font-semibold"
                    title={parada.cliente ?? undefined}
                  >
                    {parada.cliente?.trim() || 'Sem nome'}
                  </MetaChip>

                  {parada.telefone ? (
                    <MetaChip tone="phone" className="tabular-nums">
                      {parada.telefone}
                    </MetaChip>
                  ) : null}

                  <MetaChip
                    tone="address"
                    className="w-full items-start whitespace-normal"
                  >
                    <span className="text-left leading-relaxed">{endereco}</span>
                  </MetaChip>

                  <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                    {parada.valorEntrega != null &&
                    Number(parada.valorEntrega) > 0 ? (
                      <MetaField label="Valor da entrega">
                        <MetaChip tone="money" className="w-fit tabular-nums">
                          {formatCurrency(Number(parada.valorEntrega))}
                        </MetaChip>
                      </MetaField>
                    ) : null}
                    {parada.distancia != null ? (
                      <MetaField label="Distância">
                        <MetaChip tone="time" className="w-fit tabular-nums">
                          {formatDistance(Number(parada.distancia))}
                          {parada.tempo != null
                            ? ` · ${formatDuration(parada.tempo)}`
                            : ''}
                        </MetaChip>
                      </MetaField>
                    ) : null}
                  </div>

                  {parada.observacao ? (
                    <p className="text-xs text-muted-foreground">
                      {parada.observacao}
                    </p>
                  ) : null}

                  {execucao?.observacao ? (
                    <p className="text-xs text-muted-foreground">
                      Status: {execucao.observacao}
                    </p>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  )
}
