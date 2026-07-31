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
