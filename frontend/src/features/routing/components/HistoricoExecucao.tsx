import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/shared/components/ui'
import { IconClock } from '@/shared/components/icons'
import { formatDateTimeBR } from '@/shared/utils/format'
import type { ExecucaoHistoricoItem } from '../utils/executionStatus'
import { STATUS_COLORS, STATUS_LABELS } from '../utils/executionStatus'

interface HistoricoExecucaoProps {
  items: ExecucaoHistoricoItem[]
}

export function HistoricoExecucao({ items }: HistoricoExecucaoProps) {
  return (
    <Card glass>
      <CardHeader>
        <CardTitle>Histórico da execução</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<IconClock className="size-6" />}
            title="Nenhuma alteração de status"
            description="O histórico será preenchido automaticamente ao atualizar as paradas."
          />
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {[...items].reverse().map((item) => {
              const colors = STATUS_COLORS[item.status]
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border bg-surface/20 p-3 ${colors.row}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {item.cliente?.trim() || item.endereco}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.endereco}
                        {item.bairro ? ` · ${item.bairro}` : ''}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors.badge}`}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTimeBR(item.dataHora)}
                  </p>
                  {item.observacao ? (
                    <p className="mt-1 text-xs">{item.observacao}</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
