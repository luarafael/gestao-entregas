import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import type { PlannerStop } from '../schemas/routing.schema'
import { computeExecutionStats } from '../utils/executionStatus'

interface BarraProgressoExecucaoProps {
  stops: PlannerStop[]
}

export function BarraProgressoExecucao({ stops }: BarraProgressoExecucaoProps) {
  const stats = computeExecutionStats(stops)

  if (stats.total === 0) return null

  return (
    <Card glass>
      <CardHeader>
        <CardTitle>Progresso da execução</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full bg-surface/60">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats.percentual}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              {stats.entregues} de {stats.total} entregas
            </span>
            <span className="text-muted-foreground">{stats.percentual}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-lg font-semibold">{stats.pendentes}</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Em rota</p>
            <p className="text-lg font-semibold">{stats.emRota}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Entregues</p>
            <p className="text-lg font-semibold">{stats.entregues}</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Problemas</p>
            <p className="text-lg font-semibold">{stats.problemas}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
