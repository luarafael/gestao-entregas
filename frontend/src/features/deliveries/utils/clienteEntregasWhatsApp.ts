import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import { FORMA_PAGAMENTO_OPTIONS } from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

function pagamentoLabel(value: Entrega['formaPagamento']) {
  if (!value) return '—'
  return FORMA_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

export function buildClienteEntregasMotoboyWhatsAppText(entregas: Entrega[]) {
  if (entregas.length === 0) {
    return `${WA.report} *Entregas para motoboy*\n\nNenhuma entrega cadastrada.`
  }

  const lines: string[] = [
    `${WA.report} *Entregas para motoboy*`,
    `${WA.package} *Total:* ${entregas.length} entrega(s)`,
    '',
  ]

  entregas.forEach((entrega, index) => {
    lines.push(`${WA.pin} *${index + 1}. ${entrega.nomeCliente ?? 'Cliente'}*`)

    if (entrega.telefoneCliente) {
      lines.push(`${WA.user} Tel: ${entrega.telefoneCliente}`)
    }

    const local = [entrega.endereco, entrega.cidade].filter(Boolean).join(' — ')
    lines.push(`${WA.pin} ${local}`)

    const detalhes = [
      `Produto: ${formatCurrency(Number(entrega.valorProduto ?? 0))}`,
      `Pagamento: ${pagamentoLabel(entrega.formaPagamento)}`,
    ]

    if (Number(entrega.valorEntrega) > 0) {
      detalhes.push(`Taxa entrega: ${formatCurrency(Number(entrega.valorEntrega))}`)
    }

    lines.push(`${WA.money} ${detalhes.join(' | ')}`)

    if (entrega.observacao?.trim()) {
      lines.push(`${WA.memo} ${entrega.observacao.trim()}`)
    }

    lines.push(`${WA.clock} ${formatTimeBR(entrega.horario)}`)
    lines.push('')
  })

  return lines.join('\n').trim()
}
