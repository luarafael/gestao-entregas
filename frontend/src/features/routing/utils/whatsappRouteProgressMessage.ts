import { formatDateBR } from '@/shared/utils/format'
import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatDistance, formatDuration } from './googleMapsUrl'
import {
  computeExecutionStats,
  getStopStatus,
  isProblemStatus,
  STATUS_LABELS,
  type StatusExecucao,
} from './executionStatus'
import type { PlannerStop } from '../schemas/routing.schema'

export interface RouteProgressWhatsAppInput {
  data?: string
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

export function formatRouteProgressWhatsAppText(
  input: RouteProgressWhatsAppInput,
): string {
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
