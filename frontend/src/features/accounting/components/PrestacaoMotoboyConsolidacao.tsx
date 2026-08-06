import { Link } from 'react-router-dom'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'
import type { PrestacaoMotoboyResumo } from '../types'

interface PrestacaoMotoboyConsolidacaoProps {
  prestacoes: PrestacaoMotoboyResumo[]
  valorRepasseMotoboys: number
  valorLiquido: number
  pendentesAprovacao: number
}

export function PrestacaoMotoboyConsolidacao({
  prestacoes,
  valorRepasseMotoboys,
  valorLiquido,
  pendentesAprovacao,
}: PrestacaoMotoboyConsolidacaoProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Motoboys — repasse aprovado</CardTitle>
        {pendentesAprovacao > 0 ? (
          <Badge variant="warning">
            {pendentesAprovacao} aguardando aprovação
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {pendentesAprovacao > 0 ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Aprove as prestações dos motoboys em{' '}
            <Link to="/aprovacoes" className="font-medium underline">
              Aprovações
            </Link>{' '}
            antes de fechar o dia.
          </p>
        ) : null}

        {prestacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma prestação de motoboy aprovada para esta data.
          </p>
        ) : (
          <div className="space-y-2">
            {prestacoes.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/30 px-4 py-3 text-sm"
              >
                <span className="font-medium">{item.motoboyNome}</span>
                <span>
                  {item.totalEntregas} entregas ·{' '}
                  {formatCurrency(item.valorFinal)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-surface/20 p-4">
            <p className="text-xs text-muted-foreground">Total repasse motoboys</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(valorRepasseMotoboys)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/20 p-4">
            <p className="text-xs text-muted-foreground">Valor líquido</p>
            <p className="mt-1 text-lg font-semibold text-primary">
              {formatCurrency(valorLiquido)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
