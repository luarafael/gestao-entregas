import { describe, it, expect } from 'vitest'
import {
  accumulatePrestacaoDayTotals,
  calculatePeriodAverages,
  countCalendarDaysInPeriod,
  countUniqueIsoDates,
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

  it('soma prestações do mesmo dia ao agregar todos os motoboys', () => {
    const first = {
      entregas: 3,
      valor: 90,
      valorEntregas: 100,
      valorPendencias: 10,
      temPrestacao: true,
    }
    const merged = accumulatePrestacaoDayTotals(first, {
      entregas: 2,
      valor: 40,
      valorEntregas: 50,
      valorPendencias: 5,
      temPrestacao: true,
    })

    expect(merged).toEqual({
      entregas: 5,
      valor: 130,
      valorEntregas: 150,
      valorPendencias: 15,
      temPrestacao: true,
    })
  })

  it('conta dias únicos para a média quando há vários motoboys no mesmo dia', () => {
    const days = countUniqueIsoDates([
      new Date('2026-08-10T00:00:00.000Z'),
      new Date('2026-08-10T00:00:00.000Z'),
      new Date('2026-08-11T00:00:00.000Z'),
    ])

    expect(days).toBe(2)
    expect(
      calculatePeriodAverages({ totalEntregas: 10, valorEntregas: 200 }, days)
        .mediaEntregasPorDia,
    ).toBe(5)
  })
})
