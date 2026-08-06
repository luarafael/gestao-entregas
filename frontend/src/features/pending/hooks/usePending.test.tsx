import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { usePendingList, useCreatePending } from './usePending'
import { pendingService } from '../services/pending.service'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('../services/pending.service', () => ({
  pendingService: {
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

describe('usePending', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca pendências', async () => {
    vi.mocked(pendingService.list).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    })

    const { result } = renderHook(
      () =>
        usePendingList({
          page: 1,
          limit: 10,
          search: '',
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('cria pendência', async () => {
    vi.mocked(pendingService.create).mockResolvedValue({
      id: '1',
      descricao: 'Teste',
      valor: '10',
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
      tipo: 'CLIENTE',
      criadoEm: '',
    })

    const { result } = renderHook(() => useCreatePending(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      descricao: 'Teste',
      valor: 10,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })

    expect(pendingService.create).toHaveBeenCalled()
  })
})
