import { describe, it, expect } from 'vitest'
import {
  formatBusinessDateOnlyISO,
  getBusinessUtcDateOnlyRange,
  toUtcDateOnlyFromBusinessTz,
} from '../utils/date.utils.js'

describe('business timezone (America/Sao_Paulo)', () => {
  it('keeps Jul 31 in Brazil when UTC already rolled to Aug 1', () => {
    const utcAfterMidnight = new Date('2026-08-01T00:30:00.000Z')

    expect(formatBusinessDateOnlyISO(utcAfterMidnight)).toBe('2026-07-31')
    expect(toUtcDateOnlyFromBusinessTz(utcAfterMidnight).toISOString()).toBe(
      '2026-07-31T00:00:00.000Z',
    )
  })

  it('uses business today for filter=today range', () => {
    const utcAfterMidnight = new Date('2026-08-01T00:30:00.000Z')
    const { start, end } = getBusinessUtcDateOnlyRange('today', utcAfterMidnight)

    expect(start.toISOString()).toBe('2026-07-31T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-31T00:00:00.000Z')
  })

  it('respects explicit referenceDate string without shifting', () => {
    const { start, end } = getBusinessUtcDateOnlyRange('today', '2026-07-31')

    expect(start.toISOString()).toBe('2026-07-31T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-07-31T00:00:00.000Z')
  })
})
