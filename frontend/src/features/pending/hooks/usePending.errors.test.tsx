import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useCreatePending } from './usePending'
import { pendingService } from '../services/pending.service'
import { toast } from '@/shared/stores/toast.store'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('../services/pending.service', () => ({
  pendingService: {
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

describe('useCreatePending errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe toast de erro', async () => {
    vi.mocked(pendingService.create).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useCreatePending(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.mutateAsync({
        descricao: 'Teste',
        valor: 10,
        referenteAoDia: '2026-07-12',
        status: 'PENDENTE',
      }),
    ).rejects.toThrow()

    expect(toast).toHaveBeenCalledWith('Erro ao salvar pendência', 'error')
  })
})
