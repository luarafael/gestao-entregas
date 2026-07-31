import { z } from 'zod'

export const reportPeriodSchema = z.enum(['week', 'month'])

export const reportSummaryQuerySchema = z.object({
  period: reportPeriodSchema.default('week'),
})

export const reportDaysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
})

export const reportNeighborhoodQuerySchema = z.object({
  period: reportPeriodSchema.default('week'),
  limit: z.coerce.number().int().min(1).max(20).default(5),
})

export type ReportPeriod = z.infer<typeof reportPeriodSchema>
export type ReportSummaryQuery = z.infer<typeof reportSummaryQuerySchema>
export type ReportDaysQuery = z.infer<typeof reportDaysQuerySchema>
export type ReportNeighborhoodQuery = z.infer<typeof reportNeighborhoodQuerySchema>
