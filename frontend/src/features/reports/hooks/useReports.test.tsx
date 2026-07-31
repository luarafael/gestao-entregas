import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  useDailyTrend,
  useNeighborhoodReport,
  usePrestacaoTrend,
  useReportSummary,
} from './useReports'
import { apiFetch } from '@/shared/services/api'
import { createTestQueryClient } from '@/test/test-utils'

vi.mock('@/shared/services/api', () => ({
  apiFetch: vi.fn(),
}))

function createWrapper() {
  const queryClient = createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('busca resumo do período', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ totalEntregas: 5 })

    const { result } = renderHook(() => useReportSummary('week'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('busca tendência diária', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])

    const { result } = renderHook(() => useDailyTrend(7), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('busca relatório por bairro', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])

    const { result } = renderHook(() => useNeighborhoodReport('month', 5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('busca tendência de prestações', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])

    const { result } = renderHook(() => usePrestacaoTrend(30), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
