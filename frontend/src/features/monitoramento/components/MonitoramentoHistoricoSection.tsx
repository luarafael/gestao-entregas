import { useState } from 'react'
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/features/routing/utils/executionStatus'
import { formatDistance, formatDuration } from '@/features/routing/utils/googleMapsUrl'
import { IconRoute } from '@/shared/components/icons'
import { Badge, Card, MetaChip } from '@/shared/components/ui'
import { ProfileAvatar } from '@/features/auth/components/ProfileAvatar'
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
    <section className="min-w-0 space-y-4">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface/20 px-5 py-4 text-left transition-colors hover:bg-surface/35"
      >
        <div className="min-w-0">
          <p className="font-medium">Rotas concluídas hoje</p>
          <p className="text-sm text-muted-foreground">
            {rotas.length} rota(s) finalizada(s) — toque para{' '}
            {expanded ? 'ocultar' : 'ver detalhes'}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        >
          ▼
        </span>
      </button>

      {expanded ? (
        <div className="min-w-0 space-y-4">
          {rotas.map((rota) => (
            <Card
              key={rota.rotaId}
              glass={false}
              className="min-w-0 overflow-hidden border-border/60 bg-card/60 p-0"
            >
              <div className="flex min-w-0 flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  {rota.motoboyId ? (
                    <ProfileAvatar
                      userId={rota.motoboyId}
                      nome={rota.motoboyNome}
                      fotoUrl={rota.motoboyFotoPerfil}
                      size="sm"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <IconRoute className="size-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <MetaChip tone="motoboy" className="max-w-full font-semibold">
                      {rota.motoboyNome}
                    </MetaChip>
                    <div className="mt-1">
                      <MetaChip
                        tone="address"
                        className="max-w-full items-start whitespace-normal"
                        title={rota.enderecoInicial}
                      >
                        <span className="line-clamp-1 text-left">
                          {rota.enderecoInicial}
                        </span>
                      </MetaChip>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant="success">
                    {rota.stats.entregues}/{rota.totalParadas} entregues
                  </Badge>
                  <MetaChip tone="time" className="w-fit">
                    {formatDistance(rota.distanciaTotal)} ·{' '}
                    {formatDuration(rota.tempoTotal)}
                  </MetaChip>
                  {rota.concluidaEm ? (
                    <MetaChip tone="time" className="w-fit">
                      às {formatTimeBR(rota.concluidaEm)}
                    </MetaChip>
                  ) : null}
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {rota.paradas.map((parada) => (
                  <div
                    key={parada.paradaId}
                    className="flex min-w-0 items-start gap-3 px-5 py-3"
                  >
                    <span
                      className="mt-2 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[parada.status].marker }}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="tabular-nums">
                          #{parada.ordem}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {STATUS_LABELS[parada.status]}
                        </span>
                        {parada.dataHoraStatus ? (
                          <MetaChip tone="time" className="w-fit">
                            {formatTimeBR(parada.dataHoraStatus)}
                          </MetaChip>
                        ) : null}
                      </div>

                      <MetaChip
                        tone="client"
                        className="max-w-full font-medium"
                        title={parada.cliente ?? undefined}
                      >
                        {parada.cliente?.trim() || 'Sem nome'}
                      </MetaChip>

                      <MetaChip
                        tone="address"
                        className="w-full items-start whitespace-normal"
                      >
                        <span className="line-clamp-2 text-left leading-relaxed">
                          {[parada.endereco, parada.bairro].filter(Boolean).join(' — ')}
                        </span>
                      </MetaChip>
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
