import { z } from 'zod'

export const generatePrestacaoFormSchema = z.object({
  data: z.string().optional(),
  observacoes: z.string().trim().optional(),
})

export type GeneratePrestacaoFormData = z.infer<typeof generatePrestacaoFormSchema>

export interface PrestacaoFilters {
  page: number
  limit: number
}

function getTodayInputDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const defaultGenerateFormValues: GeneratePrestacaoFormData = {
  data: getTodayInputDate(),
  observacoes: '',
}

export function toGeneratePayload(data: GeneratePrestacaoFormData) {
  return {
    data: data.data ? new Date(`${data.data}T12:00:00`).toISOString() : undefined,
    observacoes: data.observacoes?.trim() || undefined,
  }
}

export function formatPrestacaoDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
