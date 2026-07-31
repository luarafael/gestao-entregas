import { describe, it, expect } from 'vitest'
import {
  formatDateOnlyISO,
  getLastDaysRange,
  getLastDaysUtcRange,
  startOfDay,
  toUtcDateOnly,
} from '../utils/date.utils.js'

describe('report date helpers', () => {
  it('should return last 7 days range', () => {
    const reference = new Date('2026-07-31T12:00:00')
    const { start, end } = getLastDaysRange(7, reference)

    expect(start.getDate()).toBe(25)
    expect(end.getDate()).toBe(31)
    expect(startOfDay(start).getHours()).toBe(0)
    expect(end.getHours()).toBe(23)
  })

  it('should return last 7 UTC days range', () => {
    const reference = new Date('2026-07-31T12:00:00')
    const { start, end } = getLastDaysUtcRange(7, reference)

    expect(formatDateOnlyISO(start)).toBe('2026-07-25')
    expect(formatDateOnlyISO(end)).toBe('2026-07-31')
  })

  it('should format date-only ISO using UTC', () => {
    expect(formatDateOnlyISO('2026-07-31')).toBe('2026-07-31')
    expect(formatDateOnlyISO(new Date('2026-07-31T00:00:00.000Z'))).toBe(
      '2026-07-31',
    )
  })

  it('should normalize date-only strings to UTC midnight', () => {
    const date = toUtcDateOnly('2026-07-31')
    expect(date.toISOString()).toBe('2026-07-31T00:00:00.000Z')
  })
})
