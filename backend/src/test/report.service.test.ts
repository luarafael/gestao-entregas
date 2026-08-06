import { beforeEach, describe, it, expect, vi } from 'vitest'
import { ReportService } from '../services/report.service.js'

const reportRepository = vi.hoisted(() => ({
  getPeriodSummary: vi.fn(),
  getPeriodDailyBreakdown: vi.fn(),
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

    expect(reportRepository.getPeriodSummary).toHaveBeenCalledWith(
      'week',
      expect.any(Date),
      undefined,
    )
    expect(result.totalEntregas).toBe(5)
  })

  it('delega resumo filtrado por motoboy', async () => {
    reportRepository.getPeriodSummary.mockResolvedValue({ totalEntregas: 2 })

    await service.getSummary({ period: 'week', motoboyId: 'm1' })

    expect(reportRepository.getPeriodSummary).toHaveBeenCalledWith(
      'week',
      expect.any(Date),
      'm1',
    )
  })

  it('delega detalhamento diário do período', async () => {
    reportRepository.getPeriodDailyBreakdown.mockResolvedValue([
      { date: '2026-07-31', temPrestacao: true },
    ])

    const result = await service.getPeriodDailyBreakdown({ period: 'week' })

    expect(result).toHaveLength(1)
  })

  it('delega relatório por bairro', async () => {
    reportRepository.getByNeighborhood.mockResolvedValue([{ bairro: 'Centro' }])

    const result = await service.getByNeighborhood({
      period: 'month',
      limit: 5,
    })

    expect(reportRepository.getByNeighborhood).toHaveBeenCalledWith(
      'month',
      5,
      expect.any(Date),
      undefined,
    )
    expect(result[0]?.bairro).toBe('Centro')
  })

  it('delega tendência de prestações', async () => {
    reportRepository.getPrestacaoTrend.mockResolvedValue([{ valorFinal: 80 }])

    const result = await service.getPrestacaoTrend('month')

    expect(result[0]?.valorFinal).toBe(80)
  })

  it('retorna indicadores do dashboard', async () => {
    reportRepository.getPeriodSummary.mockResolvedValue({ totalEntregas: 2 })

    const result = await service.getDashboardIndicators('month')

    expect(result.totalEntregas).toBe(2)
  })
})
