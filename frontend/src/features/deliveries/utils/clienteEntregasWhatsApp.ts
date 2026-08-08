import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import {
  FORMA_PAGAMENTO_OPTIONS,
  STATUS_PAGAMENTO_OPTIONS,
} from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'

function pagamentoLabel(value: Entrega['formaPagamento']) {
  if (!value) return '—'
  return FORMA_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

function statusPagamentoLabel(value: Entrega['statusPagamentoCliente']) {
  if (!value) return 'Não pago'
  return STATUS_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

export function buildClienteEntregasMotoboyWhatsAppText(entregas: Entrega[]) {
  if (entregas.length === 0) {
    return `${WA.report} *Pedidos para motoboy*\n\nNenhum pedido cadastrado.`
  }

  const lines: string[] = [
    `${WA.report} *Pedidos para motoboy*`,
    `${WA.package} *Total:* ${entregas.length} pedido(s)`,
    '',
  ]

  entregas.forEach((entrega, index) => {
    lines.push(`${index + 1}. ${WA.person} *${entrega.nomeCliente ?? 'Cliente'}*`)

    if (entrega.telefoneCliente) {
      lines.push(`${WA.phone} ${entrega.telefoneCliente}`)
    }

    const local = [entrega.endereco, entrega.cidade].filter(Boolean).join(' — ')
    lines.push(`${WA.pin} ${local}`)

    const statusIcon =
      entrega.statusPagamentoCliente === 'PAGO' ? WA.check : WA.unpaid
    const detalhes = [
      `Produto: ${formatCurrency(Number(entrega.valorProduto ?? 0))}`,
      `Pagamento: ${pagamentoLabel(entrega.formaPagamento)}`,
      `${statusIcon} ${statusPagamentoLabel(entrega.statusPagamentoCliente)}`,
    ]

    lines.push(`${WA.money} ${detalhes.join(' | ')}`)
    lines.push(
      `${WA.truck} Entrega motoboy: ${formatCurrency(Number(entrega.valorEntregaMotoboy ?? 0))}`,
    )

    if (Number(entrega.valorEntrega) > 0) {
      lines.push(`${WA.bills} Taxa entrega: ${formatCurrency(Number(entrega.valorEntrega))}`)
    }

    if (entrega.observacao?.trim()) {
      lines.push(`${WA.memo} ${entrega.observacao.trim()}`)
    }

    lines.push(`${WA.clock} ${formatTimeBR(entrega.horario)}`)
    lines.push('')
  })

  return lines.join('\n').trim()
}
