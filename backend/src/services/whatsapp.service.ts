import {
  formatCurrency,
  formatDateBR,
  formatDateOnlyBR,
} from '../utils/date.utils.js'

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
    'Prestação de Contas',
    '',
    `Data: ${formatDateBR(prestacao.data)}`,
    '',
    `Quantidade de entregas: ${prestacao.totalEntregas}`,
    '',
    'Entregas realizadas:',
    '',
  ]

  if (entregas.length === 0) {
    lines.push('• Nenhuma entrega registrada')
  } else {
    for (const entrega of entregas) {
      const cliente = entrega.nomeCliente ?? 'Sem nome'
      lines.push(
        `• ${entrega.bairro} - ${cliente} - ${formatCurrency(Number(entrega.valorEntrega))}`,
      )
    }
  }

  lines.push('', 'Pendências', '')

  if (pendencias.length === 0) {
    lines.push('• Nenhuma pendência')
  } else {
    for (const pendencia of pendencias) {
      lines.push(`• ${pendencia.descricao}`)
      lines.push(
        `Referente ao dia: ${formatDateOnlyBR(pendencia.referenteAoDia)}`,
      )
      lines.push(formatCurrency(Number(pendencia.valor)))
      lines.push('')
    }
  }

  lines.push(
    `Total das entregas:`,
    '',
    formatCurrency(Number(prestacao.valorTotal)),
    '',
    'Pendências:',
    '',
    formatCurrency(Number(prestacao.valorPendencias)),
    '',
    'Valor Final:',
    '',
    formatCurrency(Number(prestacao.valorFinal)),
    '',
    'Obrigado!',
    '',
    '---',
  )

  return lines.join('\n')
}
