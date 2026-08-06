import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useGeneratePrestacao, usePrestacaoHistory } from './usePrestacao'
import { prestacaoService } from '../services/prestacao.service'
import { createTestQueryClient } from '@/test/test-utils'
import { ApiError } from '@/shared/services/api'

vi.mock('../services/prestacao.service', () => ({
  prestacaoService: {
    list: vi.fn(),
    generate: vi.fn(),
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

describe('usePrestacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca histórico de prestações', async () => {
    vi.mocked(prestacaoService.list).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    })

    const { result } = renderHook(
      () => usePrestacaoHistory({ page: 1, limit: 10 }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('gera prestação com sucesso', async () => {
    vi.mocked(prestacaoService.generate).mockResolvedValue({
      prestacao: {
        id: '1',
        data: '2026-07-31',
        totalEntregas: 1,
        valorTotal: '25',
        valorPendencias: '0',
        valorFinal: '25',
        valorRepasseMotoboys: '0',
        valorLiquido: '25',
        observacoes: null,
        criadoEm: '',
      },
      entregas: [],
      pendencias: [],
      whatsappText: 'texto',
    })

    const { result } = renderHook(() => useGeneratePrestacao(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({ data: '2026-07-31', observacoes: '' })

    expect(prestacaoService.generate).toHaveBeenCalled()
  })

  it('trata ApiError ao gerar prestação', async () => {
    vi.mocked(prestacaoService.generate).mockRejectedValue(
      new ApiError(409, 'Já existe prestação'),
    )

    const { result } = renderHook(() => useGeneratePrestacao(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.mutateAsync({ data: '2026-07-31', observacoes: '' }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('trata erro genérico ao gerar prestação', async () => {
    vi.mocked(prestacaoService.generate).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useGeneratePrestacao(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.mutateAsync({ data: '2026-07-31', observacoes: '' }),
    ).rejects.toThrow()
  })
})
