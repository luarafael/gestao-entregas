import {
  formatCurrency,
  formatDateOnlyBR,
} from '../utils/date.utils.js'
import { WA } from '../utils/whatsappEmoji.js'

interface PrestacaoSummary {
  data: Date
  totalEntregas: number
  valorTotal: number | { toString(): string }
  valorPendencias: number | { toString(): string }
  valorFinal: number | { toString(): string }
}

interface EntregaSummary {
  bairro: string
  nomeCliente: string | null
  valorEntrega: number | { toString(): string }
  pagoPeloCliente?: boolean
  motoboyNome?: string | null
  motoboyId?: string | null
}

export interface GenerateWhatsAppOptions {
  motoboyId?: string
  agruparPorMotoboy?: boolean
}

interface PendenciaSummary {
  descricao: string
  valor: number | { toString(): string }
  referenteAoDia: Date | string
}

interface MotoboyPrestacaoSummary {
  motoboyNome: string
  totalEntregas: number
  valorFinal: number
}

function formatEntregaLine(entrega: EntregaSummary): string {
  const cliente = entrega.nomeCliente?.trim() || 'Sem nome'
  const valor = formatCurrency(Number(entrega.valorEntrega))
  const pagoPeloCliente = entrega.pagoPeloCliente ? ' — _pago pelo cliente_' : ''

  return `• ${WA.pin} ${entrega.bairro} - ${WA.user} ${cliente} - ${WA.money} ${valor}${pagoPeloCliente}`
}

function appendEntregasSection(
  lines: string[],
  entregas: EntregaSummary[],
  options?: { agruparPorMotoboy?: boolean; motoboyId?: string },
) {
  const filtered = options?.motoboyId
    ? entregas.filter((entrega) => entrega.motoboyId === options.motoboyId)
    : entregas

  lines.push(`${WA.truck} *Entregas realizadas:*`, '')

  if (filtered.length === 0) {
    lines.push('• Nenhuma entrega registrada', '')
    return
  }

  const motoboyNames = [
    ...new Set(
      filtered
        .map((entrega) => entrega.motoboyNome?.trim())
        .filter((nome): nome is string => Boolean(nome)),
    ),
  ]

  const shouldGroup =
    options?.agruparPorMotoboy !== false && motoboyNames.length > 0

  if (shouldGroup) {
    for (const motoboyNome of motoboyNames) {
      lines.push(`*${motoboyNome}*`)
      for (const entrega of filtered.filter(
        (item) => item.motoboyNome?.trim() === motoboyNome,
      )) {
        lines.push(formatEntregaLine(entrega))
      }
      lines.push('')
    }

    const semMotoboy = filtered.filter((item) => !item.motoboyNome?.trim())
    if (semMotoboy.length > 0) {
      lines.push('*Sem motoboy*')
      for (const entrega of semMotoboy) {
        lines.push(formatEntregaLine(entrega))
      }
      lines.push('')
    }
  } else {
    for (const entrega of filtered) {
      lines.push(formatEntregaLine(entrega))
    }
    lines.push('')
  }

  const pagasPeloCliente = filtered.filter((entrega) => entrega.pagoPeloCliente)
  if (pagasPeloCliente.length > 0) {
    const valorForaDoTotal = pagasPeloCliente.reduce(
      (sum, entrega) => sum + Number(entrega.valorEntrega),
      0,
    )

    lines.push(
      `${WA.check} *Pagas pelo cliente (fora do total):* ${pagasPeloCliente.length} corrida(s) — ${formatCurrency(valorForaDoTotal)}`,
      '',
    )
  }
}

export function generateWhatsAppText(
  prestacao: PrestacaoSummary & {
    valorRepasseMotoboys?: number | { toString(): string }
    valorLiquido?: number | { toString(): string }
  },
  entregas: EntregaSummary[],
  pendencias: PendenciaSummary[],
  prestacoesMotoboy: MotoboyPrestacaoSummary[] = [],
  options?: GenerateWhatsAppOptions,
): string {
  const lines: string[] = [
    `${WA.report} *Prestação de Contas*`,
    '',
    `${WA.clock} *Data:* ${formatDateOnlyBR(prestacao.data)}`,
    '',
    `${WA.package} *Entregas:* ${prestacao.totalEntregas}`,
    '',
  ]

  appendEntregasSection(lines, entregas, {
    motoboyId: options?.motoboyId,
    agruparPorMotoboy: options?.agruparPorMotoboy,
  })

  if (pendencias.length > 0) {
    lines.push(`${WA.hourglass} *Pendências*`, '')

    for (const pendencia of pendencias) {
      lines.push(`• ${WA.memo} ${pendencia.descricao}`)
      lines.push(
        `  ${WA.clock} Referente ao dia: ${formatDateOnlyBR(pendencia.referenteAoDia)}`,
      )
      lines.push(`  ${WA.money} ${formatCurrency(Number(pendencia.valor))}`)
      lines.push('')
    }
  }

  lines.push(
    `${WA.bills} *Total das entregas:*`,
    '',
    formatCurrency(Number(prestacao.valorTotal)),
    '',
  )

  if (pendencias.length > 0) {
    lines.push(
      `${WA.warning} *Pendências:*`,
      '',
      formatCurrency(Number(prestacao.valorPendencias)),
      '',
    )
  }

  lines.push(`${WA.truck} *Repasse motoboys (aprovado):*`, '')

  if (prestacoesMotoboy.length === 0) {
    lines.push('• Nenhum repasse aprovado', '')
  } else {
    for (const item of prestacoesMotoboy) {
      lines.push(
        `• ${WA.user} ${item.motoboyNome} — ${item.totalEntregas} entrega(s) — ${formatCurrency(item.valorFinal)}`,
      )
    }
    lines.push('')
  }

  lines.push(
    `${WA.warning} *Total repasse motoboys:*`,
    '',
    formatCurrency(Number(prestacao.valorRepasseMotoboys ?? 0)),
    '',
    `${WA.check} *Valor final:*`,
    '',
    formatCurrency(Number(prestacao.valorFinal)),
    '',
  )

  if (prestacao.valorLiquido !== undefined) {
    lines.push(
      `${WA.check} *Valor líquido (após motoboys):*`,
      '',
      formatCurrency(Number(prestacao.valorLiquido)),
      '',
    )
  }

  lines.push(`${WA.thanks} Obrigado!`, '', '---')

  return lines.join('\n')
}

export function generateMotoboyPrestacaoWhatsAppText(
  motoboyNome: string,
  prestacao: PrestacaoSummary,
  entregas: EntregaSummary[],
  pendencias: PendenciaSummary[],
  pix?: string | null,
): string {
  const lines: string[] = [
    `${WA.report} *Prestação do dia — ${motoboyNome}*`,
    `${WA.clock} *Data:* ${formatDateOnlyBR(prestacao.data)}`,
  ]

  if (entregas.length > 0) {
    lines.push(`${WA.package} *Corridas:* ${prestacao.totalEntregas}`)

    for (const entrega of entregas) {
      lines.push(formatEntregaLine(entrega))
    }
  }

  if (pendencias.length > 0) {
    lines.push(`${WA.hourglass} *Repasse pendente:*`)

    for (const pendencia of pendencias) {
      lines.push(
        `• ${WA.memo} ${pendencia.descricao} — ${formatDateOnlyBR(pendencia.referenteAoDia)} — ${formatCurrency(Number(pendencia.valor))}`,
      )
    }
  }

  const valorFinal = Number(prestacao.valorFinal)
  if (valorFinal > 0) {
    lines.push(`${WA.money} *Repasse:* ${formatCurrency(valorFinal)}`)
  }

  const pixKey = pix?.trim()
  if (pixKey) {
    lines.push(`${WA.key} *PIX:* ${pixKey}`)
  }

  return lines.join('\n')
}

export function generateClientePrestacaoWhatsAppText(
  nomeCliente: string,
  prestacao: Pick<PrestacaoSummary, 'data' | 'totalEntregas' | 'valorFinal'>,
  entregas: EntregaSummary[],
): string {
  const lines: string[] = [
    `${WA.report} *Prestação — ${nomeCliente}*`,
    `${WA.clock} *Data:* ${formatDateOnlyBR(prestacao.data)}`,
  ]

  if (entregas.length > 0) {
    lines.push(`${WA.package} *Entregas:* ${prestacao.totalEntregas}`)

    for (const entrega of entregas) {
      const motoboy = entrega.motoboyNome?.trim()
      const motoboyInfo = motoboy ? ` — ${WA.user} ${motoboy}` : ''
      const valor = formatCurrency(Number(entrega.valorEntrega))
      const pagoPeloCliente = entrega.pagoPeloCliente
        ? ' — _pago pelo cliente_'
        : ''

      lines.push(
        `• ${WA.pin} ${entrega.bairro} - ${WA.money} ${valor}${motoboyInfo}${pagoPeloCliente}`,
      )
    }
  }

  const valorFinal = Number(prestacao.valorFinal)
  if (valorFinal > 0) {
    lines.push(`${WA.money} *Total:* ${formatCurrency(valorFinal)}`)
  }

  return lines.join('\n')
}
