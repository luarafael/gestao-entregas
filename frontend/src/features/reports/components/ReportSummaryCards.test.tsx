import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportSummaryCards } from './ReportSummaryCards'

describe('ReportSummaryCards', () => {
  it('renderiza skeleton no loading', () => {
    render(<ReportSummaryCards isLoading />)

    expect(document.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0)
  })

  it('renderiza cards com resumo', () => {
    render(
      <ReportSummaryCards
        summary={{
          period: 'week',
          totalEntregas: 10,
          valorEntregas: 300,
          mediaEntregasPorDia: 2,
          mediaValorPorDia: 60,
          totalPrestacoes: 3,
          valorFinalPrestacoes: 250,
          pendenciasAbertas: 1,
          valorPendenciasAbertas: 20,
        }}
      />,
    )

    expect(screen.getByText('Entregas no período')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
