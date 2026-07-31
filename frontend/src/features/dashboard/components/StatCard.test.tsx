import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { IconPackage } from '@/shared/components/icons'

describe('StatCard', () => {
  it('exibe título e valor', () => {
    render(
      <StatCard
        title="Entregas Hoje"
        value="12"
        description="Total registrado"
        icon={<IconPackage className="size-5" data-testid="icon" />}
      />,
    )

    expect(screen.getByText('Entregas Hoje')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Total registrado')).toBeInTheDocument()
  })
})
