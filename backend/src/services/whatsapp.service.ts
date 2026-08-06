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

export function generateWhatsAppText(
  prestacao: PrestacaoSummary,
  entregas: EntregaSummary[],
  pendencias: PendenciaSummary[],
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
    `${WA.check} *Valor final:*`,
    '',
    formatCurrency(Number(prestacao.valorFinal)),
    '',
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
