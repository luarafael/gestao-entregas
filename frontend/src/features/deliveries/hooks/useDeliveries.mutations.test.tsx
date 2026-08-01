import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  useDeleteDelivery,
  useUpdateDelivery,
} from './useDeliveries'
import { deliveryService } from '../services/delivery.service'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('../services/delivery.service', () => ({
  deliveryService: {
    update: vi.fn(),
    delete: vi.fn(),
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

describe('useDeliveries mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('atualiza entrega', async () => {
    vi.mocked(deliveryService.update).mockResolvedValue({
      id: '1',
      data: '',
      horario: '',
      nomeCliente: null,
      endereco: 'Rua A',
      bairro: 'Centro',
      cidade: null,
      observacao: null,
      valorEntrega: '10',
      pagoPeloCliente: false,
      status: 'ENTREGUE',
      criadoEm: '',
    })

    const { result } = renderHook(() => useUpdateDelivery(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: '1',
      data: { endereco: 'Rua A', bairro: 'Centro', valorEntrega: 10, pagoPeloCliente: false },
    })

    expect(deliveryService.update).toHaveBeenCalled()
  })

  it('exclui entrega', async () => {
    vi.mocked(deliveryService.delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteDelivery(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('1')

    expect(deliveryService.delete).toHaveBeenCalledWith('1')
  })
})
