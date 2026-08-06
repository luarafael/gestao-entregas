import { describe, it, expect } from 'vitest'
import {
  reportDailyBreakdownQuerySchema,
  reportDaysQuerySchema,
  reportNeighborhoodQuerySchema,
  reportSummaryQuerySchema,
} from '../schemas/report.schema.js'

describe('report schemas', () => {
  it('should parse summary query with default period', () => {
    const parsed = reportSummaryQuerySchema.parse({})

    expect(parsed.period).toBe('week')
  })

  it('should parse daily breakdown query with default period', () => {
    const parsed = reportDailyBreakdownQuerySchema.parse({})

    expect(parsed.period).toBe('week')
  })

  it('should parse daily trend days with coercion', () => {
    const parsed = reportDaysQuerySchema.parse({ days: '14' })

    expect(parsed.days).toBe(14)
  })

  it('should parse neighborhood query with limit', () => {
    const parsed = reportNeighborhoodQuerySchema.parse({
      period: 'month',
      limit: '8',
    })

    expect(parsed.period).toBe('month')
    expect(parsed.limit).toBe(8)
  })

  it('should parse optional motoboyId on summary query', () => {
    const parsed = reportSummaryQuerySchema.parse({
      period: 'week',
      motoboyId: 'motoboy-1',
    })

    expect(parsed.motoboyId).toBe('motoboy-1')
  })
})
