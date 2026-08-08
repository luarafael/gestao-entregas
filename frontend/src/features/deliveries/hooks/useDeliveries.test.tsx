import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useDeliveries, useCreateDelivery } from './useDeliveries'
import { deliveryService } from '../services/delivery.service'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('../services/delivery.service', () => ({
  deliveryService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('@/shared/stores/toast.store', () => ({
  toast: vi.fn(),
}))

function createWrapper() {
  const queryClient = createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useDeliveries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca entregas com filtros', async () => {
    vi.mocked(deliveryService.list).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    })

    const { result } = renderHook(
      () =>
        useDeliveries({
          page: 1,
          limit: 10,
          search: '',
          filter: 'today',
          sortBy: 'horario',
          sortOrder: 'desc',
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deliveryService.list).toHaveBeenCalled()
  })

  it('cria entrega com sucesso', async () => {
    vi.mocked(deliveryService.create).mockResolvedValue({
      id: '1',
      data: '',
      horario: '',
      nomeCliente: null,
      endereco: 'Rua A',
      bairro: 'Centro',
      cidade: null,
      observacao: null,
      valorEntrega: '10',
      valorProduto: null,
      formaPagamento: null,
      pagoPeloCliente: false,
      status: 'ENTREGUE',
      criadoEm: '',
    })

    const { result } = renderHook(() => useCreateDelivery('motoboy'), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 10,
      pagoPeloCliente: false,
    })

    expect(deliveryService.create).toHaveBeenCalled()
  })
})
