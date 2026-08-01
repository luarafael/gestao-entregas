export type DateFilter = 'today' | 'yesterday' | 'week' | 'month'

export const BUSINESS_TIMEZONE = 'America/Sao_Paulo'

/** Data civil no fuso do negócio (Brasil) como YYYY-MM-DD */
export function formatBusinessDateOnlyISO(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function resolveBusinessDayIso(reference: Date | string): string {
  if (typeof reference === 'string') {
    const match = reference.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) {
      return match[1]
    }
  }

  return formatBusinessDateOnlyISO(reference)
}

function getBusinessDayOfWeek(reference: Date | string): number {
  const instant =
    typeof reference === 'string'
      ? new Date(`${resolveBusinessDayIso(reference)}T12:00:00.000Z`)
      : reference

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'short',
  }).format(instant)

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return map[weekday] ?? 0
}

/** Instante atual -> dia civil Brasil -> UTC date-only (@db.Date) */
export function toUtcDateOnlyFromBusinessTz(date = new Date()): Date {
  return toUtcDateOnly(formatBusinessDateOnlyISO(date))
}

export function getBusinessUtcDateOnlyRange(
  filter: DateFilter,
  reference: Date | string = new Date(),
): { start: Date; end: Date } {
  const refEnd = toUtcDateOnly(resolveBusinessDayIso(reference))

  switch (filter) {
    case 'today':
      return { start: refEnd, end: refEnd }

    case 'yesterday': {
      const start = new Date(refEnd)
      start.setUTCDate(start.getUTCDate() - 1)
      return { start, end: start }
    }

    case 'week': {
      const dow = getBusinessDayOfWeek(reference)
      const diff = dow === 0 ? 6 : dow - 1
      const start = new Date(refEnd)
      start.setUTCDate(start.getUTCDate() - diff)
      return { start, end: refEnd }
    }

    case 'month': {
      const iso = resolveBusinessDayIso(reference)
      const [year, month] = iso.split('-')
      const start = toUtcDateOnly(`${year}-${month}-01`)
      return { start, end: refEnd }
    }
  }
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export function getDateRange(filter: DateFilter, reference = new Date()): {
  start: Date
  end: Date
} {
  const today = startOfDay(reference)

  switch (filter) {
    case 'today':
      return { start: today, end: endOfDay(reference) }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: yesterday, end: endOfDay(yesterday) }
    }

    case 'week': {
      const start = new Date(today)
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(start.getDate() - diff)
      return { start, end: endOfDay(reference) }
    }

    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start, end: endOfDay(reference) }
    }
  }
}

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getLastDaysRange(days: number, reference = new Date()): {
  start: Date
  end: Date
} {
  const end = endOfDay(reference)
  const start = startOfDay(reference)
  start.setDate(start.getDate() - (days - 1))
  return { start, end }
}

/** Converte para meia-noite UTC — padrão para campos @db.Date no PostgreSQL */
export function toUtcDateOnly(date: Date | string): Date {
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, year, month, day] = match
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    }
  }

  const parsed = date instanceof Date ? date : new Date(date)
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  )
}

/** Data do calendário local -> UTC date-only */
export function toUtcDateOnlyFromLocal(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
}

export function getUtcDateOnlyRange(
  filter: DateFilter,
  reference: Date | string = new Date(),
): { start: Date; end: Date } {
  return getBusinessUtcDateOnlyRange(filter, reference)
}

export function getLastDaysUtcRange(
  days: number,
  reference: Date | string = new Date(),
): { start: Date; end: Date } {
  const end = toUtcDateOnly(resolveBusinessDayIso(reference))
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return { start, end }
}

export function formatDateOnlyISO(date: Date | string): string {
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) {
      return match[1]
    }
  }

  const parsed = date instanceof Date ? date : new Date(date)
  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateOnlyBR(date: Date | string): string {
  if (typeof date === 'string') {
    const [year, month, day] = date.slice(0, 10).split('-')
    if (year && month && day) {
      return `${day}/${month}/${year}`
    }
  }

  const parsed = date instanceof Date ? date : new Date(date)
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const year = parsed.getUTCFullYear()
  return `${day}/${month}/${year}`
}

export function formatTimeBR(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
