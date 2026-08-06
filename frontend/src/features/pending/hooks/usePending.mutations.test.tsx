import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  useDeletePending,
  useUpdatePending,
} from './usePending'
import { pendingService } from '../services/pending.service'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('../services/pending.service', () => ({
  pendingService: {
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

describe('usePending mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('atualiza pendência', async () => {
    vi.mocked(pendingService.update).mockResolvedValue({
      id: '1',
      descricao: 'Teste',
      valor: '10',
      referenteAoDia: '2026-07-12',
      status: 'RECEBIDO',
      tipo: 'CLIENTE',
      criadoEm: '',
    })

    const { result } = renderHook(() => useUpdatePending(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: '1',
      data: {
        descricao: 'Teste',
        valor: 10,
        referenteAoDia: '2026-07-12',
        status: 'RECEBIDO',
      },
    })

    expect(pendingService.update).toHaveBeenCalled()
  })

  it('exclui pendência', async () => {
    vi.mocked(pendingService.delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeletePending(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('1')

    expect(pendingService.delete).toHaveBeenCalledWith('1')
  })
})
