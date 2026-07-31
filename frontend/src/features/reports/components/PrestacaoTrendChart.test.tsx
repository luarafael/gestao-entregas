import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrestacaoTrendChart } from './PrestacaoTrendChart'

vi.mock('recharts', async () => {
  const { rechartsMock } = await import('@/test/recharts.mock')
  return rechartsMock
})

describe('PrestacaoTrendChart', () => {
  it('mostra empty state sem prestações', () => {
    render(<PrestacaoTrendChart data={[]} />)

    expect(
      screen.getByText('Nenhuma prestação gerada no período.'),
    ).toBeInTheDocument()
  })

  it('renderiza gráfico com histórico', () => {
    render(
      <PrestacaoTrendChart
        data={[{ date: '2026-07-31', valorFinal: 80, totalEntregas: 2 }]}
      />,
    )

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})
