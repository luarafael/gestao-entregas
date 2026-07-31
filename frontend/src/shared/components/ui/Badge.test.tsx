import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renderiza conteúdo', () => {
    render(<Badge>Pendente</Badge>)

    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })
})
