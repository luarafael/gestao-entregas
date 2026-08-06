import { z } from 'zod'
import { getTodayInputDate } from '@/shared/utils/date'
import { formatDateBR } from '@/shared/utils/format'

export const submitPrestacaoMotoboyFormSchema = z.object({
  data: z.string().optional(),
  observacoes: z.string().trim().optional(),
  motoboyId: z.string().trim().min(1).optional(),
})

export type SubmitPrestacaoMotoboyFormData = z.infer<
  typeof submitPrestacaoMotoboyFormSchema
>

export function toSubmitPayload(data: SubmitPrestacaoMotoboyFormData) {
  return {
    data: data.data || undefined,
    observacoes: data.observacoes?.trim() || undefined,
    motoboyId: data.motoboyId || undefined,
  }
}

export function formatPrestacaoMotoboyDate(date: string) {
  return formatDateBR(date)
}

export { getTodayInputDate }

export const defaultSubmitFormValues: SubmitPrestacaoMotoboyFormData = {
  data: getTodayInputDate(),
  observacoes: '',
}
