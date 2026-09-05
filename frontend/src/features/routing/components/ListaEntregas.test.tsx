import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListaEntregas } from './ListaEntregas'

describe('aviso de recálculo da rota', () => {
  it('só pede recálculo quando a rota já foi calculada e sofreu alterações', () => {
    const props = { stops: [], onEdit: vi.fn(), onRemove: vi.fn(), onReorder: vi.fn() }
    const { rerender } = render(<ListaEntregas {...props} orderDirty optimized={false} />)
    expect(screen.queryByText(/Recalcule/)).not.toBeInTheDocument()
    rerender(<ListaEntregas {...props} orderDirty optimized />)
    expect(screen.getByText(/As entregas ou a sequência da rota mudaram/)).toBeInTheDocument()
    rerender(<ListaEntregas {...props} orderDirty={false} optimized />)
    expect(screen.queryByText(/Recalcule/)).not.toBeInTheDocument()
  })
})
