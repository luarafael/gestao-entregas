import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useCreateMotoboyDelivery } from './useDeliveries'
import { deliveryService } from '../services/delivery.service'
import { toast } from '@/shared/stores/toast.store'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('../services/delivery.service', () => ({
  deliveryService: {
    createMotoboy: vi.fn(),
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

describe('useCreateMotoboyDelivery errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe toast de erro', async () => {
    vi.mocked(deliveryService.createMotoboy).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useCreateMotoboyDelivery(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.mutateAsync({
        endereco: 'Rua A',
        bairro: 'Centro',
        valorEntrega: 10,
        pagoPeloCliente: false,
      }),
    ).rejects.toThrow()

    expect(toast).toHaveBeenCalledWith('Erro ao salvar entrega', 'error')
  })
})
