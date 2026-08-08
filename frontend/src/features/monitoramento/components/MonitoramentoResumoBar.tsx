import type { ReactNode } from 'react'
import { IconAlert, IconClock, IconPackage, IconRoute } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import type { MonitoramentoResponse } from '../types'

interface MonitoramentoResumoBarProps {
  resumo: MonitoramentoResponse['resumo']
  atualizadoEm?: string
  isFetching?: boolean
  formatTime: (value: string) => string
}

function ResumoItem({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: ReactNode
  tone: 'neutral' | 'blue' | 'green' | 'red'
}) {
  const toneStyles = {
    neutral: 'bg-surface/30 text-foreground',
    blue: 'bg-blue-500/10 text-blue-300',
    green: 'bg-emerald-500/10 text-emerald-300',
    red: 'bg-red-500/10 text-red-300',
  }

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3',
        toneStyles[tone],
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-black/10">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export function MonitoramentoResumoBar({
  resumo,
  atualizadoEm,
  isFetching,
  formatTime,
}: MonitoramentoResumoBarProps) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <ResumoItem
          label="Rotas ativas"
          value={resumo.totalRotas}
          icon={<IconRoute className="size-4" />}
          tone="blue"
        />
        <ResumoItem
          label="Paradas"
          value={resumo.totalParadas}
          icon={<IconPackage className="size-4" />}
          tone="neutral"
        />
        <ResumoItem
          label="Entregues"
          value={resumo.entregues}
          icon={<IconClock className="size-4" />}
          tone="green"
        />
        <ResumoItem
          label="Problemas"
          value={resumo.problemas}
          icon={<IconAlert className="size-4" />}
          tone={resumo.problemas > 0 ? 'red' : 'neutral'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {resumo.emRota > 0 ? (
          <span>{resumo.emRota} parada(s) em rota agora</span>
        ) : null}
        {resumo.pendentes > 0 ? (
          <span>{resumo.pendentes} pendente(s)</span>
        ) : null}
        {resumo.rotasConcluidas > 0 ? (
          <span>{resumo.rotasConcluidas} rota(s) concluída(s) hoje</span>
        ) : null}
        {atualizadoEm ? (
          <span className="ml-auto">
            Atualizado às {formatTime(atualizadoEm)}
            {isFetching ? ' · sincronizando...' : ''}
          </span>
        ) : null}
      </div>
    </div>
  )
}
