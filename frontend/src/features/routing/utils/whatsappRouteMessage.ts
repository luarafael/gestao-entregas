import { formatCurrency } from '@/shared/utils/cn'
import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatUrgentLabel } from './urgentPriority'
import { formatDistance, formatDuration } from './googleMapsUrl'
import { appendStopPaymentWhatsAppLines } from './routeStopPayment'
import type { PlannerStop } from '../schemas/routing.schema'

export interface RouteWhatsAppInput {
  enderecoInicial: string
  distanciaTotal: number
  tempoTotal: number
  aproximada: boolean
  sugestoes?: string[]
  paradas: PlannerStop[]
}

function formatStopAddress(stop: PlannerStop): string {
  if (stop.bairro && !stop.endereco.toLowerCase().includes(stop.bairro.toLowerCase())) {
    return `${stop.endereco} — ${stop.bairro}`
  }
  return stop.endereco
}

export function formatRouteWhatsAppText(input: RouteWhatsAppInput): string {
  const valorTotalEntregas = input.paradas.reduce(
    (sum, stop) => sum + (stop.valorEntrega != null ? Number(stop.valorEntrega) : 0),
    0,
  )

  const lines: string[] = [
    '---',
    '',
    `${WA.truck} *Rota planejada*`,
    '',
    `${WA.pin} *Partida:*`,
    input.enderecoInicial,
    '',
    `${WA.package} *Total de entregas:* ${input.paradas.length}`,
    `${WA.chart} *Distância total:* ${formatDistance(input.distanciaTotal)}${input.aproximada ? ' _(aproximada)_' : ''}`,
    `${WA.clock} *Tempo estimado:* ${formatDuration(input.tempoTotal)}`,
  ]

  if (valorTotalEntregas > 0) {
    lines.push(
      `${WA.money} *Valor das entregas:* ${formatCurrency(valorTotalEntregas)}`,
    )
  }

  lines.push('', `${WA.truck} *Sequência de paradas:*`, '')

  for (const stop of input.paradas) {
    const ordem = stop.ordem ?? 0
    const prioridade =
      stop.prioridade === 'URGENTE'
        ? ` — _${formatUrgentLabel(stop.ordemUrgencia)}_`
        : ''

    lines.push(`${ordem}. ${WA.pin} *Parada ${ordem}*${prioridade}`)

    if (stop.cliente?.trim()) {
      lines.push(`   ${WA.user} ${stop.cliente.trim()}`)
    }

    lines.push(`   ${formatStopAddress(stop)}`)

    if (stop.observacao?.trim()) {
      lines.push(`   ${WA.memo} ${stop.observacao.trim()}`)
    }

    appendStopPaymentWhatsAppLines(lines, stop)

    if (stop.valorEntrega != null && Number(stop.valorEntrega) > 0) {
      lines.push(`   ${WA.money} ${formatCurrency(Number(stop.valorEntrega))}`)
    }

    if (stop.distancia != null && stop.tempo != null) {
      lines.push(
        `   ${WA.clock} Trecho: ${formatDistance(stop.distancia)} · ${formatDuration(stop.tempo)}`,
      )
    }

    lines.push('')
  }

  if (input.sugestoes?.length) {
    lines.push(`${WA.warning} *Observações:*`, '')
    for (const sugestao of input.sugestoes) {
      lines.push(`• ${sugestao}`)
    }
    lines.push('')
  }

  lines.push(`${WA.thanks} Boa rota!`, '', '---')

  return lines.join('\n')
}

export function buildRouteWhatsAppPayload(
  result: {
    enderecoInicial: string
    distanciaTotal: number
    tempoTotal: number
    aproximada: boolean
    sugestoes?: string[]
    paradas: PlannerStop[]
  },
): RouteWhatsAppInput {
  return {
    enderecoInicial: result.enderecoInicial,
    distanciaTotal: result.distanciaTotal,
    tempoTotal: result.tempoTotal,
    aproximada: result.aproximada,
    sugestoes: result.sugestoes,
    paradas: result.paradas,
  }
}
