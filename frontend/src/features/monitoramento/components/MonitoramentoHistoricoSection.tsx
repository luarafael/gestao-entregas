import { useState } from 'react'
import {
  STATUS_LABELS,
} from '@/features/routing/utils/executionStatus'
import { formatDistance, formatDuration } from '@/features/routing/utils/googleMapsUrl'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
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
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-surface/20 px-4 py-3 text-left text-sm transition-colors hover:bg-surface/40"
      >
        <span className="font-medium text-muted-foreground">
          Histórico do dia ({rotas.length})
        </span>
        <span className="text-xs text-muted-foreground">
          {expanded ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-3">
          {rotas.map((rota) => (
            <Card key={rota.rotaId}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{rota.motoboyNome}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {rota.enderecoInicial}
                    </p>
                  </div>
                  <Badge variant="success">
                    {rota.stats.entregues}/{rota.totalParadas} concluídas
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    {formatDistance(rota.distanciaTotal)} ·{' '}
                    {formatDuration(rota.tempoTotal)}
                  </span>
                  {rota.concluidaEm ? (
                    <span>Finalizada às {formatTimeBR(rota.concluidaEm)}</span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {rota.paradas.map((parada) => (
                  <div
                    key={parada.paradaId}
                    className="rounded-lg border border-border/40 bg-surface/10 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
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
                    <p className="font-medium">
                      {parada.cliente ?? 'Sem nome'}
                      {parada.bairro ? ` — ${parada.bairro}` : ''}
                    </p>
                    <p className="text-muted-foreground">{parada.endereco}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}
