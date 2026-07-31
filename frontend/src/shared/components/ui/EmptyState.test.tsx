import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="Nenhum item"
        description="Cadastre o primeiro registro."
        action={<button type="button">Ação</button>}
      />,
    )

    expect(screen.getByText('Nenhum item')).toBeInTheDocument()
    expect(screen.getByText('Cadastre o primeiro registro.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument()
  })
})
