import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  useNeighborhoodReport,
  usePeriodDailyBreakdown,
  usePrestacaoTrend,
  useReportDayDetail,
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

  it('busca detalhamento diário do período', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])

    const { result } = renderHook(() => usePeriodDailyBreakdown('week'), {
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

    const { result } = renderHook(() => usePrestacaoTrend('month'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('busca detalhe do dia selecionado', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ date: '2026-08-10', entregas: [] })

    const { result } = renderHook(
      () => useReportDayDetail('2026-08-10', 'm1', 'MOTOBOY'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiFetch).toHaveBeenCalledWith(
      '/api/reports/day-detail?date=2026-08-10&motoboyId=m1&origemCadastro=MOTOBOY',
    )
  })
})
