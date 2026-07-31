import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NeighborhoodChart } from './NeighborhoodChart'

vi.mock('recharts', async () => {
  const { rechartsMock } = await import('@/test/recharts.mock')
  return rechartsMock
})

describe('NeighborhoodChart', () => {
  it('mostra empty state sem dados', () => {
    render(<NeighborhoodChart data={[]} periodLabel="Esta semana" />)

    expect(
      screen.getByText('Nenhuma entrega registrada no período.'),
    ).toBeInTheDocument()
  })

  it('renderiza gráfico com bairros', () => {
    render(
      <NeighborhoodChart
        data={[{ bairro: 'Centro', entregas: 3, valor: 90 }]}
        periodLabel="Esta semana"
      />,
    )

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
