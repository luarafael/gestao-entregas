import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renderiza o dashboard na rota inicial', () => {
    render(<App />)
    expect(screen.getByText('Resumo do dia')).toBeInTheDocument()
  })

  it('renderiza a navegação principal', () => {
    render(<App />)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Entregas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pendências').length).toBeGreaterThan(0)
  })
})
