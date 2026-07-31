import { describe, it, expect } from 'vitest'
import { formatChartDate, getPeriodLabel } from '../utils/chart.utils'

describe('chart.utils', () => {
  it('formata data ISO para exibição no gráfico', () => {
    expect(formatChartDate('2026-07-31')).toBe('31/07')
  })

  it('retorna rótulo do período', () => {
    expect(getPeriodLabel('week')).toBe('Esta semana')
    expect(getPeriodLabel('month')).toBe('Este mês')
  })
})
