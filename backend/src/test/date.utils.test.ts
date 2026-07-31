import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDateBR,
  formatDateOnlyBR,
  getDateRange,
  startOfDay,
} from '../utils/date.utils.js'

describe('date.utils', () => {
  it('should return start of day', () => {
    const date = new Date('2026-07-31T15:30:00')
    const start = startOfDay(date)

    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getDate()).toBe(31)
  })

  it('should get today date range', () => {
    const reference = new Date('2026-07-31T12:00:00')
    const { start, end } = getDateRange('today', reference)

    expect(start.getDate()).toBe(31)
    expect(end.getDate()).toBe(31)
    expect(end.getHours()).toBe(23)
  })

  it('should get yesterday date range', () => {
    const reference = new Date('2026-07-31T12:00:00')
    const { start } = getDateRange('yesterday', reference)

    expect(start.getDate()).toBe(30)
  })

  it('should format date in pt-BR', () => {
    const formatted = formatDateBR(new Date(2026, 6, 31))
    expect(formatted).toBe('31/07/2026')
  })

  it('should format currency in BRL', () => {
    const formatted = formatCurrency(1234.56)
    expect(formatted).toContain('1.234,56')
    expect(formatted).toContain('R$')
  })

  it('should format date-only values without timezone shift', () => {
    expect(formatDateOnlyBR('2026-07-12')).toBe('12/07/2026')
    expect(formatDateOnlyBR(new Date('2026-07-12'))).toBe('12/07/2026')
  })
})
