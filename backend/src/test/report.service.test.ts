import { beforeEach, describe, it, expect, vi } from 'vitest'
import { ReportService } from '../services/report.service.js'

const reportRepository = vi.hoisted(() => ({
  getPeriodSummary: vi.fn(),
  getDailyTrend: vi.fn(),
  getByNeighborhood: vi.fn(),
  getPrestacaoTrend: vi.fn(),
}))

vi.mock('../repositories/report.repository.js', () => ({
  reportRepository,
}))

describe('ReportService', () => {
  const service = new ReportService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delega resumo do período', async () => {
    reportRepository.getPeriodSummary.mockResolvedValue({ totalEntregas: 5 })

    const result = await service.getSummary({ period: 'week' })

    expect(result.totalEntregas).toBe(5)
  })

  it('delega tendência diária', async () => {
    reportRepository.getDailyTrend.mockResolvedValue([{ date: '2026-07-31' }])

    const result = await service.getDailyTrend({ days: 7 })

    expect(result).toHaveLength(1)
  })

  it('delega relatório por bairro', async () => {
    reportRepository.getByNeighborhood.mockResolvedValue([{ bairro: 'Centro' }])

    const result = await service.getByNeighborhood({
      period: 'month',
      limit: 5,
    })

    expect(result[0]?.bairro).toBe('Centro')
  })

  it('delega tendência de prestações', async () => {
    reportRepository.getPrestacaoTrend.mockResolvedValue([{ valorFinal: 80 }])

    const result = await service.getPrestacaoTrend({ days: 30 })

    expect(result[0]?.valorFinal).toBe(80)
  })

  it('retorna indicadores do dashboard', async () => {
    reportRepository.getPeriodSummary.mockResolvedValue({ totalEntregas: 2 })

    const result = await service.getDashboardIndicators('month')

    expect(result.totalEntregas).toBe(2)
  })
})
