import { describe, it, expect } from 'vitest'
import {
  formatDateOnlyISO,
  getLastDaysRange,
  startOfDay,
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

  it('should format date as ISO yyyy-mm-dd', () => {
    expect(formatDateOnlyISO(new Date(2026, 6, 31))).toBe('2026-07-31')
  })
})
