import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodFilter } from './PeriodFilter'

describe('PeriodFilter', () => {
  it('alterna período selecionado', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PeriodFilter value="week" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Mês' }))

    expect(onChange).toHaveBeenCalledWith('month')
  })
})
