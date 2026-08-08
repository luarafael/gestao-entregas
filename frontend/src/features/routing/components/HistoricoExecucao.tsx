import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  MetaChip,
  PAGE_CARD_ARTICLE,
} from '@/shared/components/ui'
import { IconClock } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { formatDateTimeBR } from '@/shared/utils/format'
import type { ExecucaoHistoricoItem, StatusExecucao } from '../utils/executionStatus'
import { STATUS_LABELS } from '../utils/executionStatus'

interface HistoricoExecucaoProps {
  items: ExecucaoHistoricoItem[]
}

const STATUS_TEXT: Record<StatusExecucao, string> = {
  PENDENTE: 'text-muted-foreground',
  EM_ROTA: 'text-blue-600 dark:text-blue-300',
  ENTREGUE: 'text-emerald-600 dark:text-emerald-300',
  CLIENTE_AUSENTE: 'text-amber-700 dark:text-amber-300',
  NAO_LOCALIZADO: 'text-orange-700 dark:text-orange-300',
  CANCELADA: 'text-muted-foreground',
  FALHA_ENTREGA: 'text-red-600 dark:text-red-300',
}

function formatEnderecoLabel(endereco: string, bairro?: string | null) {
  return [endereco, bairro?.trim()].filter(Boolean).join(' · ')
}

export function HistoricoExecucao({ items }: HistoricoExecucaoProps) {
  return (
    <Card glass className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Histórico da execução</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<IconClock className="size-6" />}
            title="Nenhuma alteração de status"
            description="O histórico será preenchido automaticamente ao atualizar as paradas."
          />
        ) : (
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {[...items].reverse().map((item) => (
              <article
                key={item.id}
                className={cn(PAGE_CARD_ARTICLE, 'min-w-0 space-y-2')}
              >
                <MetaChip
                  tone="client"
                  className="max-w-full text-sm font-semibold"
                  title={item.cliente ?? undefined}
                >
                  {item.cliente?.trim() || 'Sem nome'}
                </MetaChip>

                <MetaChip
                  tone="address"
                  className="w-full items-start whitespace-normal"
                >
                  <span className="line-clamp-2 text-left leading-relaxed">
                    {formatEnderecoLabel(item.endereco, item.bairro)}
                  </span>
                </MetaChip>

                <p
                  className={cn(
                    'text-sm font-medium',
                    STATUS_TEXT[item.status],
                  )}
                >
                  {STATUS_LABELS[item.status]}
                </p>

                <MetaChip tone="time" className="w-fit tabular-nums">
                  {formatDateTimeBR(item.dataHora)}
                </MetaChip>

                {item.observacao ? (
                  <p className="text-xs text-muted-foreground">{item.observacao}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
