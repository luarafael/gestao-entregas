/** Alinhado ao backend — fuso do negócio (Brasil). */
export const BUSINESS_TIMEZONE = 'America/Sao_Paulo'

/** Data civil no fuso do negócio como YYYY-MM-DD. */
export function getTodayInputDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Extrai YYYY-MM-DD de ISO/string sem deslocamento de fuso. */
export function formatDateOnlyFromIso(value: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) {
    return match[1]
  }

  return getTodayInputDate(new Date(value))
}
