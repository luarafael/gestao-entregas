import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/shared/services/api'
import { deliveryService } from './delivery.service'
import { mergeStopsWithLiveEntregas } from '@/features/routing/utils/routeStopPayment'
import type { Entrega } from '@/shared/types/api.types'

vi.mock('@/shared/services/api', () => ({ apiFetch: vi.fn(async () => ({})) }))

describe('pagamento da entrega do motoboy', () => {
  it('envia contato, forma e status independentemente do desconto de prestação', async () => {
    await deliveryService.createMotoboy({
      nomeCliente: 'Maria',
      telefoneCliente: '85999990000',
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 12,
      pagoPeloCliente: false,
      formaPagamento: 'PIX',
      statusPagamentoCliente: 'PAGO',
    })
    const options = vi.mocked(apiFetch).mock.calls.at(-1)?.[1]
    expect(JSON.parse(String(options?.body))).toMatchObject({
      telefoneCliente: '85999990000',
      formaPagamento: 'PIX',
      statusPagamentoCliente: 'PAGO',
      pagoPeloCliente: false,
    })
  })
  it('atualiza as informações de pagamento na parada ligada à entrega', () => {
    const result = mergeStopsWithLiveEntregas(
      [
        {
          tempId: 'p1',
          entregaId: 'e1',
          endereco: 'Rua A',
          prioridade: 'NORMAL',
        },
      ],
      [
        {
          id: 'e1',
          formaPagamento: 'PIX',
          statusPagamentoCliente: 'PAGO',
          valorProduto: null,
        } as Entrega,
      ],
    )
    expect(result[0]).toMatchObject({
      formaPagamento: 'PIX',
      statusPagamentoCliente: 'PAGO',
    })
  })
  it('envia null quando a forma de pagamento é removida na edição', async () => {
    await deliveryService.updateMotoboy('e1', {
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 12,
      formaPagamento: null,
    })
    expect(
      JSON.parse(String(vi.mocked(apiFetch).mock.calls.at(-1)?.[1]?.body)),
    ).toHaveProperty('formaPagamento', null)
  })
})
