import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyBreakdownTable } from './DailyBreakdownTable'

describe('DailyBreakdownTable', () => {
  it('renderiza linhas da tabela', () => {
    render(
      <DailyBreakdownTable
        data={[
          { date: '2026-07-31', entregas: 2, valor: 50 },
          { date: '2026-07-30', entregas: 1, valor: 25 },
        ]}
      />,
    )

    expect(screen.getByText('Detalhamento diário')).toBeInTheDocument()
    expect(screen.getByText('31/07')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
