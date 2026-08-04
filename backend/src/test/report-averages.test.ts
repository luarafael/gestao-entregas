import { describe, it, expect } from 'vitest'
import {
  calculatePeriodAverages,
  countCalendarDaysInPeriod,
} from '../utils/report.utils.js'

describe('report utils', () => {
  it('calcula médias por dia com prestação fechada', () => {
    const averages = calculatePeriodAverages(
      { totalEntregas: 8, valorEntregas: 250 },
      1,
    )

    expect(averages.mediaEntregasPorDia).toBe(8)
    expect(averages.mediaValorPorDia).toBe(250)
  })

  it('divide pelos dias fechados quando há mais de uma prestação', () => {
    const averages = calculatePeriodAverages(
      { totalEntregas: 8, valorEntregas: 250 },
      2,
    )

    expect(averages.mediaEntregasPorDia).toBe(4)
    expect(averages.mediaValorPorDia).toBe(125)
  })

  it('retorna zero quando não há prestações no período', () => {
    const averages = calculatePeriodAverages(
      { totalEntregas: 0, valorEntregas: 0 },
      0,
    )

    expect(averages.mediaEntregasPorDia).toBe(0)
    expect(averages.mediaValorPorDia).toBe(0)
  })

  it('conta dias corridos da semana (segunda até a referência)', () => {
    const days = countCalendarDaysInPeriod(
      'week',
      new Date('2026-08-06T15:00:00.000Z'),
    )

    expect(days).toBe(4)
  })

  it('conta dias corridos do mês (dia 1 até a referência)', () => {
    const days = countCalendarDaysInPeriod(
      'month',
      new Date('2026-08-06T15:00:00.000Z'),
    )

    expect(days).toBe(6)
  })

  it('usa a mesma regra de média para semana e mês (dias com prestação)', () => {
    const weekAverage = calculatePeriodAverages(
      { totalEntregas: 12, valorEntregas: 360 },
      3,
    )
    const monthAverage = calculatePeriodAverages(
      { totalEntregas: 12, valorEntregas: 360 },
      3,
    )

    expect(weekAverage).toEqual(monthAverage)
    expect(weekAverage.mediaEntregasPorDia).toBe(4)
    expect(weekAverage.mediaValorPorDia).toBe(120)
  })
})
