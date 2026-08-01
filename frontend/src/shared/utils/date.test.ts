import { describe, it, expect } from 'vitest'
import { getTodayInputDate } from './date'

describe('shared date utils', () => {
  it('uses America/Sao_Paulo for today input date', () => {
    const utcAfterMidnight = new Date('2026-08-01T00:30:00.000Z')
    expect(getTodayInputDate(utcAfterMidnight)).toBe('2026-07-31')
  })
})
