import { useState } from 'react'
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/features/routing/utils/executionStatus'
import { formatDistance, formatDuration } from '@/features/routing/utils/googleMapsUrl'
import { IconRoute } from '@/shared/components/icons'
import { Badge, Card } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import type { MonitoramentoRotaHistorico } from '../types'

interface MonitoramentoHistoricoSectionProps {
  rotas: MonitoramentoRotaHistorico[]
}

export function MonitoramentoHistoricoSection({
  rotas,
}: MonitoramentoHistoricoSectionProps) {
  const [expanded, setExpanded] = useState(false)

  if (rotas.length === 0) return null

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface/20 px-5 py-4 text-left transition-colors hover:bg-surface/35"
      >
        <div>
          <p className="font-medium">Rotas concluídas hoje</p>
          <p className="text-sm text-muted-foreground">
            {rotas.length} rota(s) finalizada(s) — toque para{' '}
            {expanded ? 'ocultar' : 'ver detalhes'}
          </p>
        </div>
        <span
          className={cn(
            'text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        >
          ▼
        </span>
      </button>

      {expanded ? (
        <div className="space-y-4">
          {rotas.map((rota) => (
            <Card
              key={rota.rotaId}
              glass={false}
              className="border-border/60 bg-card/60 p-0"
            >
              <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <IconRoute className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{rota.motoboyNome}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {rota.enderecoInicial}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant="success">
                    {rota.stats.entregues}/{rota.totalParadas} entregues
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(rota.distanciaTotal)} ·{' '}
                    {formatDuration(rota.tempoTotal)}
                  </span>
                  {rota.concluidaEm ? (
                    <span className="text-xs text-muted-foreground">
                      às {formatTimeBR(rota.concluidaEm)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {rota.paradas.map((parada) => (
                  <div
                    key={parada.paradaId}
                    className="flex items-start gap-3 px-5 py-3 text-sm"
                  >
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[parada.status].marker }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums">
                          #{parada.ordem}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {STATUS_LABELS[parada.status]}
                        </span>
                        {parada.dataHoraStatus ? (
                          <span className="text-xs text-muted-foreground">
                            {formatTimeBR(parada.dataHoraStatus)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 font-medium">
                        {parada.cliente?.trim() || 'Sem nome'}
                        {parada.bairro ? ` · ${parada.bairro}` : ''}
                      </p>
                      <p className="text-muted-foreground">{parada.endereco}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}
