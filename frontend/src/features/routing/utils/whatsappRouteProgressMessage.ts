import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR, formatTimeBR } from '@/shared/utils/format'
import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatUrgentLabel } from './urgentPriority'
import { formatDistance, formatDuration } from './googleMapsUrl'
import {
  computeExecutionStats,
  getActiveStopsForRoute,
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
  atualizadoEm?: string
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

  for (const key of Object.keys(groups) as StatusExecucao[]) {
    groups[key].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  }

  return groups
}

function formatStopLine(stop: PlannerStop): string {
  const ordem = stop.ordem ? `Parada ${String(stop.ordem).padStart(2, '0')} — ` : ''
  const nome = stop.cliente?.trim() || 'Sem nome'
  return `${ordem}${nome}`
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

function formatStatusTime(stop: PlannerStop): string | null {
  if (!stop.statusAtualizadoEm) return null
  return formatTimeBR(stop.statusAtualizadoEm)
}

function appendTrecho(lines: string[], stop: PlannerStop) {
  if (stop.distancia != null && stop.tempo != null) {
    lines.push(
      `   ${WA.clock} Trecho: ${formatDistance(stop.distancia)} · ${formatDuration(stop.tempo)}`,
    )
  }
}

function appendValor(lines: string[], stop: PlannerStop) {
  if (stop.valorEntrega != null && Number(stop.valorEntrega) > 0) {
    lines.push(`   ${WA.money} ${formatCurrency(Number(stop.valorEntrega))}`)
  }
}

function appendStopBase(lines: string[], stop: PlannerStop) {
  lines.push(`• ${formatStopLine(stop)}`)
  lines.push(`   ${formatStopAddress(stop)}`)
  if (stop.telefone?.trim()) {
    lines.push(`   📞 ${stop.telefone.trim()}`)
  }
}

function appendEntregueDetails(lines: string[], stop: PlannerStop) {
  appendStopBase(lines, stop)
  const horario = formatStatusTime(stop)
  if (horario) {
    lines.push(`   ${WA.check} Entregue às ${horario}`)
  } else {
    lines.push(`   ${WA.check} Entregue`)
  }
  appendTrecho(lines, stop)
  appendValor(lines, stop)
  if (stop.observacao?.trim()) {
    lines.push(`   ${WA.memo} ${stop.observacao.trim()}`)
  }
  lines.push('')
}

function appendEmRotaDetails(lines: string[], stop: PlannerStop) {
  appendStopBase(lines, stop)
  lines.push(`   🟦 Status: Em rota`)
  const horario = formatStatusTime(stop)
  if (horario) {
    lines.push(`   ${WA.clock} Atualizado às ${horario}`)
  }
  appendTrecho(lines, stop)
  appendValor(lines, stop)
  lines.push('')
}

function appendPendenteDetails(lines: string[], stop: PlannerStop) {
  appendStopBase(lines, stop)
  if (stop.prioridade === 'URGENTE') {
    lines.push(`   ⚠️ ${formatUrgentLabel(stop.ordemUrgencia)}`)
  }
  appendTrecho(lines, stop)
  lines.push('')
}

function appendProblemaDetails(lines: string[], stop: PlannerStop) {
  const status = getStopStatus(stop)
  appendStopBase(lines, stop)
  lines.push(`   ❌ ${STATUS_LABELS[status]}`)
  const horario = formatStatusTime(stop)
  if (horario) {
    lines.push(`   ${WA.clock} Registrado às ${horario}`)
  }
  if (stop.statusObservacao?.trim()) {
    lines.push(`   ${WA.memo} ${stop.statusObservacao.trim()}`)
  }
  lines.push('')
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
  const atualizadoLabel = input.atualizadoEm
    ? formatTimeBR(input.atualizadoEm)
    : formatTimeBR(new Date().toISOString())

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
    `🕐 Atualizado às ${atualizadoLabel}`,
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
    appendEntregueDetails(lines, stop)
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
  const atualizadoLabel = input.atualizadoEm
    ? formatTimeBR(input.atualizadoEm)
    : formatTimeBR(new Date().toISOString())

  const activeStops = getActiveStopsForRoute(input.stops)
  const activeMetrics = sumStopRouteMetrics(activeStops)
  const completedStops = input.stops.filter(
    (stop) => getStopStatus(stop) === 'ENTREGUE',
  )
  const completedMetrics = sumStopRouteMetrics(completedStops)

  const distanciaRestante =
    input.distanciaRestante ?? activeMetrics.distancia
  const tempoRestante = input.tempoRestante ?? activeMetrics.tempo

  const lines: string[] = [
    `${WA.pin} *Andamento da Rota*`,
    '',
    `📅 Data: ${dataLabel}`,
    `🕐 Atualizado às ${atualizadoLabel}`,
    '',
    `${WA.truck} Rota em execução`,
  ]

  if (input.enderecoInicial?.trim()) {
    lines.push('', `${WA.pin} *Partida:* ${input.enderecoInicial.trim()}`)
  }

  lines.push('', '━━━━━━━━━━━━━━', '', `✅ *ENTREGUES* (${groups.ENTREGUE.length})`, '')

  if (groups.ENTREGUE.length === 0) {
    lines.push('_(nenhuma ainda)_', '')
  } else {
    for (const stop of groups.ENTREGUE) {
      appendEntregueDetails(lines, stop)
    }
  }

  lines.push('━━━━━━━━━━━━━━', '', `🟦 *EM ROTA* (${groups.EM_ROTA.length})`, '')

  if (groups.EM_ROTA.length === 0) {
    lines.push('_(nenhuma)_', '')
  } else {
    for (const stop of groups.EM_ROTA) {
      appendEmRotaDetails(lines, stop)
    }
  }

  lines.push('━━━━━━━━━━━━━━', '', `⏳ *PENDENTES* (${groups.PENDENTE.length})`, '')

  if (groups.PENDENTE.length === 0) {
    lines.push('_(nenhuma)_', '')
  } else {
    for (const stop of groups.PENDENTE) {
      appendPendenteDetails(lines, stop)
    }
  }

  const problemStops = input.stops.filter((stop) => {
    const status = getStopStatus(stop)
    return isProblemStatus(status) || status === 'CANCELADA'
  })

  lines.push('━━━━━━━━━━━━━━', '', `❌ *PROBLEMAS* (${problemStops.length})`, '')

  if (problemStops.length === 0) {
    lines.push('_(nenhum)_', '')
  } else {
    for (const stop of problemStops) {
      appendProblemaDetails(lines, stop)
    }
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

  if (completedMetrics.distancia > 0) {
    lines.push(
      `Distância concluída: ${formatDistance(completedMetrics.distancia)}`,
    )
  }

  if (distanciaRestante > 0) {
    lines.push(`Distância restante: ${formatDistance(distanciaRestante)}`)
  }

  if (completedMetrics.tempo > 0) {
    lines.push(`Tempo concluído: ${formatDuration(completedMetrics.tempo)}`)
  }

  if (tempoRestante > 0) {
    lines.push(`Tempo restante: ${formatDuration(tempoRestante)}`)
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━',
    '',
    'Mensagem gerada automaticamente pelo Planejador de Rotas.',
  )

  return lines.join('\n')
}
