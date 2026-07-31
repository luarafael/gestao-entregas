export function formatChartDate(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

export function getPeriodLabel(period: 'week' | 'month') {
  return period === 'week' ? 'Esta semana' : 'Este mês'
}
