import { z } from 'zod'
import { getTodayInputDate } from '@/shared/utils/date'
import { formatDateBR } from '@/shared/utils/format'

export const generatePrestacaoFormSchema = z.object({
  data: z.string().optional(),
  observacoes: z.string().trim().optional(),
})

export type GeneratePrestacaoFormData = z.infer<typeof generatePrestacaoFormSchema>

export interface PrestacaoFilters {
  page: number
  limit: number
}

export { getTodayInputDate }

export const defaultGenerateFormValues: GeneratePrestacaoFormData = {
  data: getTodayInputDate(),
  observacoes: '',
}

export function toGeneratePayload(data: GeneratePrestacaoFormData) {
  return {
    data: data.data || undefined,
    observacoes: data.observacoes?.trim() || undefined,
  }
}

export function formatPrestacaoDate(date: string) {
  return formatDateBR(date)
}
