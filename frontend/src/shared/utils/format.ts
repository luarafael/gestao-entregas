import { BUSINESS_TIMEZONE } from './date'

export function formatDateBR(value: string | Date): string {
  if (typeof value === 'string') {
    const [year, month, day] = value.slice(0, 10).split('-')
    if (year && month && day) {
      return `${day}/${month}/${year}`
    }
  }

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: BUSINESS_TIMEZONE,
  })
}

export function formatTimeBR(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BUSINESS_TIMEZONE,
  })
}

export function formatDateTimeBR(value: string | Date): string {
  return `${formatDateBR(value)} ${formatTimeBR(
    typeof value === 'string' ? value : value.toISOString(),
  )}`
}
