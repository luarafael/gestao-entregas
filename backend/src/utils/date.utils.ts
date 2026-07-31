export type DateFilter = 'today' | 'yesterday' | 'week' | 'month'

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
  reference = new Date(),
): { start: Date; end: Date } {
  const { start, end } = getDateRange(filter, reference)

  return {
    start: toUtcDateOnlyFromLocal(start),
    end: toUtcDateOnlyFromLocal(end),
  }
}

export function getLastDaysUtcRange(
  days: number,
  reference = new Date(),
): { start: Date; end: Date } {
  const end = toUtcDateOnlyFromLocal(reference)
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
