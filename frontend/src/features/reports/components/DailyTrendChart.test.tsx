import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyTrendChart } from './DailyTrendChart'

vi.mock('recharts', async () => {
  const { rechartsMock } = await import('@/test/recharts.mock')
  return rechartsMock
})

describe('DailyTrendChart', () => {
  it('renderiza estado vazio de loading', () => {
    render(<DailyTrendChart isLoading />)

    expect(screen.getByText('Prestações por dia')).toBeInTheDocument()
  })

  it('renderiza gráfico com dados', () => {
    render(
      <DailyTrendChart
        data={[{ date: '2026-07-31', entregas: 2, valor: 50 }]}
      />,
    )

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
