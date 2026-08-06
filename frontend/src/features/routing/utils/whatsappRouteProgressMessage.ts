import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatUrgentLabel } from './urgentPriority'
import { formatDistance, formatDuration } from './googleMapsUrl'
import {
  computeExecutionStats,
  getStopStatus,
  isAllStopsDelivered,
  isProblemStatus,
  sumStopRouteMetrics,
  STATUS_LABELS,
  type StatusExecucao,
} from './executionStatus'
import type { PlannerStop } from '../schemas/routing.schema'

export interface RouteProgressWhatsAppInput {
  data?: string
  enderecoInicial?: string
  distanciaTotal?: number
  tempoTotal?: number
  aproximada?: boolean
  stops: PlannerStop[]
  distanciaRestante?: number
  tempoRestante?: number
}

function groupByStatus(stops: PlannerStop[]) {
  const groups: Record<StatusExecucao, PlannerStop[]> = {
    PENDENTE: [],
    EM_ROTA: [],
    ENTREGUE: [],
    CLIENTE_AUSENTE: [],
    NAO_LOCALIZADO: [],
    CANCELADA: [],
    FALHA_ENTREGA: [],
  }

  for (const stop of stops) {
    groups[getStopStatus(stop)].push(stop)
  }

  return groups
}

function formatStopLine(stop: PlannerStop): string {
  return stop.cliente?.trim() || stop.endereco
}

function formatStopAddress(stop: PlannerStop): string {
  if (
    stop.bairro &&
    !stop.endereco.toLowerCase().includes(stop.bairro.toLowerCase())
  ) {
    return `${stop.endereco} — ${stop.bairro}`
  }
  return stop.endereco
}

function formatDeliveredAt(stop: PlannerStop): string | null {
  if (!stop.statusAtualizadoEm) return null
  return `${formatDateBR(stop.statusAtualizadoEm)} às ${formatTimeBR(stop.statusAtualizadoEm)}`
}

export function formatRouteCompletedWhatsAppText(
  input: RouteProgressWhatsAppInput,
): string {
  const stats = computeExecutionStats(input.stops)
  const metrics = sumStopRouteMetrics(input.stops)
  const distanciaTotal = input.distanciaTotal ?? metrics.distancia
  const tempoTotal = input.tempoTotal ?? metrics.tempo
  const dataLabel = input.data
    ? formatDateBR(input.data)
    : formatDateBR(new Date().toISOString())

  const valorTotal = input.stops.reduce(
    (sum, stop) => sum + (stop.valorEntrega != null ? Number(stop.valorEntrega) : 0),
    0,
  )

  const ordered = [...input.stops].sort(
    (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
  )

  const lines: string[] = [
    `${WA.check} *Rota concluída*`,
    '',
    `📅 Data: ${dataLabel}`,
  ]

  if (input.enderecoInicial?.trim()) {
    lines.push('', `${WA.pin} *Partida:*`, input.enderecoInicial.trim())
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━',
    '',
    `${WA.chart} *Resumo final*`,
    '',
    `${WA.package} Total de entregas: ${stats.total}`,
    `${WA.check} Entregues: ${stats.entregues}`,
    `${WA.chart} Distância total: ${formatDistance(distanciaTotal)}${input.aproximada ? ' _(aproximada)_' : ''}`,
    `${WA.clock} Tempo total: ${formatDuration(tempoTotal)}`,
  )

  if (valorTotal > 0) {
    lines.push(`${WA.money} Valor das entregas: ${formatCurrency(valorTotal)}`)
  }

  lines.push('', '━━━━━━━━━━━━━━', '', `✅ *Entregas realizadas*`, '')

  for (const stop of ordered) {
    const ordem = stop.ordem ?? 0
    const prioridade =
      stop.prioridade === 'URGENTE'
        ? ` — _${formatUrgentLabel(stop.ordemUrgencia)}_`
        : ''

    lines.push(`${ordem}. ${formatStopLine(stop)}${prioridade}`)
    lines.push(`   ${formatStopAddress(stop)}`)

    if (stop.telefone?.trim()) {
      lines.push(`   📞 ${stop.telefone.trim()}`)
    }

    const entregueEm = formatDeliveredAt(stop)
    if (entregueEm) {
      lines.push(`   ${WA.check} Entregue em ${entregueEm}`)
    } else {
      lines.push(`   ${WA.check} Entregue`)
    }

    if (stop.distancia != null && stop.tempo != null) {
      lines.push(
        `   ${WA.clock} Trecho: ${formatDistance(stop.distancia)} · ${formatDuration(stop.tempo)}`,
      )
    }

    if (stop.valorEntrega != null && Number(stop.valorEntrega) > 0) {
      lines.push(`   ${WA.money} ${formatCurrency(Number(stop.valorEntrega))}`)
    }

    if (stop.observacao?.trim()) {
      lines.push(`   ${WA.memo} ${stop.observacao.trim()}`)
    }

    lines.push('')
  }

  lines.push(
    '━━━━━━━━━━━━━━',
    '',
    `${WA.thanks} Todas as entregas foram concluídas com sucesso!`,
    '',
    'Mensagem gerada automaticamente pelo Planejador de Rotas.',
  )

  return lines.join('\n')
}

export function formatRouteProgressWhatsAppText(
  input: RouteProgressWhatsAppInput,
): string {
  if (isAllStopsDelivered(input.stops)) {
    return formatRouteCompletedWhatsAppText(input)
  }

  const stats = computeExecutionStats(input.stops)
  const groups = groupByStatus(input.stops)
  const dataLabel = input.data
    ? formatDateBR(input.data)
    : formatDateBR(new Date().toISOString())

  const lines: string[] = [
    `${WA.pin} *Andamento da Rota*`,
    '',
    `📅 Data: ${dataLabel}`,
    '',
    `${WA.truck} Rota em execução`,
    '',
    '━━━━━━━━━━━━━━',
    '',
    `✅ *ENTREGUES*`,
    '',
  ]

  if (groups.ENTREGUE.length === 0) {
    lines.push('_(nenhuma ainda)_', '')
  } else {
    for (const stop of groups.ENTREGUE) {
      lines.push(`✔ ${formatStopLine(stop)}`)
    }
    lines.push('')
  }

  lines.push('━━━━━━━━━━━━━━', '', `🟦 *EM ROTA*`, '')

  if (groups.EM_ROTA.length === 0) {
    lines.push('_(nenhuma)_', '')
  } else {
    for (const stop of groups.EM_ROTA) {
      lines.push(`• ${formatStopLine(stop)}`)
    }
    lines.push('')
  }

  lines.push('━━━━━━━━━━━━━━', '', `⏳ *PENDENTES*`, '')

  if (groups.PENDENTE.length === 0) {
    lines.push('_(nenhuma)_', '')
  } else {
    for (const stop of groups.PENDENTE) {
      lines.push(`• ${formatStopLine(stop)}`)
    }
    lines.push('')
  }

  const problemStops = input.stops.filter((stop) => {
    const status = getStopStatus(stop)
    return isProblemStatus(status) || status === 'CANCELADA'
  })

  lines.push('━━━━━━━━━━━━━━', '', `❌ *PROBLEMAS*`, '')

  if (problemStops.length === 0) {
    lines.push('_(nenhum)_', '')
  } else {
    for (const stop of problemStops) {
      const status = getStopStatus(stop)
      lines.push(`• ${formatStopLine(stop)}`)
      lines.push(`  ${STATUS_LABELS[status]}`)
      if (stop.statusObservacao?.trim()) {
        lines.push(`  ${stop.statusObservacao.trim()}`)
      }
    }
    lines.push('')
  }

  lines.push(
    '━━━━━━━━━━━━━━',
    '',
    `${WA.chart} *RESUMO*`,
    '',
    `Total de entregas: ${stats.total}`,
    `Entregues: ${stats.entregues}`,
    `Pendentes: ${stats.pendentes + stats.emRota}`,
    `Problemas: ${stats.problemas}`,
    `Percentual concluído: ${stats.percentual}%`,
  )

  if (input.distanciaRestante != null && input.distanciaRestante > 0) {
    lines.push(`Distância restante: ${formatDistance(input.distanciaRestante)}`)
  }

  if (input.tempoRestante != null && input.tempoRestante > 0) {
    lines.push(`Tempo restante: ${formatDuration(input.tempoRestante)}`)
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━',
    '',
    'Mensagem gerada automaticamente pelo Planejador de Rotas.',
  )

  return lines.join('\n')
}
