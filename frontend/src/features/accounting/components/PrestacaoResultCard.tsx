import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'
import type { GeneratePrestacaoResponse } from '../types'

interface PrestacaoResultCardProps {
  result: GeneratePrestacaoResponse
}

export function PrestacaoResultCard({ result }: PrestacaoResultCardProps) {
  const { prestacao } = result

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Resumo da prestação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryItem
              label="Entregas"
              value={String(prestacao.totalEntregas)}
            />
            <SummaryItem
              label="Total das entregas"
              value={formatCurrency(Number(prestacao.valorTotal))}
            />
            <SummaryItem
              label="Pendências"
              value={formatCurrency(Number(prestacao.valorPendencias))}
            />
            <SummaryItem
              label="Valor final (bruto)"
              value={formatCurrency(Number(prestacao.valorFinal))}
            />
            <SummaryItem
              label="Repasse motoboys"
              value={formatCurrency(Number(prestacao.valorRepasseMotoboys))}
            />
            <SummaryItem
              label="Valor líquido"
              value={formatCurrency(Number(prestacao.valorLiquido))}
              highlight
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SummaryItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          highlight
            ? 'mt-2 text-2xl font-semibold text-primary'
            : 'mt-2 text-xl font-semibold'
        }
      >
        {value}
      </p>
    </div>
  )
}
