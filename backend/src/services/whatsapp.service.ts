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

export function generateWhatsAppText(
  prestacao: PrestacaoSummary & {
    valorRepasseMotoboys?: number | { toString(): string }
    valorLiquido?: number | { toString(): string }
  },
  entregas: EntregaSummary[],
  pendencias: PendenciaSummary[],
  prestacoesMotoboy: MotoboyPrestacaoSummary[] = [],
): string {
  const lines: string[] = [
    '---',
    '',
    `${WA.report} *Prestação de Contas*`,
    '',
    `${WA.clock} *Data:* ${formatDateOnlyBR(prestacao.data)}`,
    '',
    `${WA.package} *Entregas:* ${prestacao.totalEntregas}`,
    '',
    `${WA.truck} *Entregas realizadas:*`,
    '',
  ]

  if (entregas.length === 0) {
    lines.push('• Nenhuma entrega registrada')
  } else {
    for (const entrega of entregas) {
      const cliente = entrega.nomeCliente ?? 'Sem nome'
      const valor = formatCurrency(Number(entrega.valorEntrega))
      const pagoPeloCliente = entrega.pagoPeloCliente
        ? ' — _pago pelo cliente_'
        : ''

      lines.push(
        `• ${WA.pin} ${entrega.bairro} - ${WA.user} ${cliente} - ${WA.money} ${valor}${pagoPeloCliente}`,
      )
    }

    const pagasPeloCliente = entregas.filter((entrega) => entrega.pagoPeloCliente)
    if (pagasPeloCliente.length > 0) {
      const valorForaDoTotal = pagasPeloCliente.reduce(
        (sum, entrega) => sum + Number(entrega.valorEntrega),
        0,
      )

      lines.push(
        '',
        `${WA.check} *Pagas pelo cliente (fora do total):* ${pagasPeloCliente.length} corrida(s) — ${formatCurrency(valorForaDoTotal)}`,
      )
    }
  }

  lines.push('', `${WA.hourglass} *Pendências*`, '')

  if (pendencias.length === 0) {
    lines.push('• Nenhuma pendência')
  } else {
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
    `${WA.warning} *Pendências:*`,
    '',
    formatCurrency(Number(prestacao.valorPendencias)),
    '',
  )

  if (prestacoesMotoboy.length > 0) {
    lines.push(`${WA.truck} *Repasse motoboys (aprovado):*`, '')
    for (const item of prestacoesMotoboy) {
      lines.push(
        `• ${WA.user} ${item.motoboyNome} — ${item.totalEntregas} entrega(s) — ${formatCurrency(item.valorFinal)}`,
      )
    }
    lines.push(
      '',
      `${WA.warning} *Total repasse motoboys:*`,
      '',
      formatCurrency(Number(prestacao.valorRepasseMotoboys ?? 0)),
      '',
    )
  }

  lines.push(
    `${WA.check} *Valor final:*`,
    '',
    formatCurrency(Number(prestacao.valorFinal)),
    '',
  )

  if (prestacoesMotoboy.length > 0 && prestacao.valorLiquido !== undefined) {
    lines.push(
      `${WA.check} *Valor líquido (após motoboys):*`,
      '',
      formatCurrency(Number(prestacao.valorLiquido)),
      '',
    )
  }

  lines.push(
    `${WA.thanks} Obrigado!`,
    '',
    '---',
  )

  return lines.join('\n')
}

export function generateMotoboyPrestacaoWhatsAppText(
  motoboyNome: string,
  prestacao: PrestacaoSummary,
  entregas: EntregaSummary[],
  pendencias: PendenciaSummary[],
): string {
  const base = generateWhatsAppText(prestacao, entregas, pendencias)
  return base.replace(
    `${WA.report} *Prestação de Contas*`,
    `${WA.report} *Prestação do dia — ${motoboyNome}*`,
  )
}
