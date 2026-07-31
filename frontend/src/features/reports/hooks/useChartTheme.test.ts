import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useChartTheme } from './useChartTheme'

describe('useChartTheme', () => {
  it('retorna paleta do tema atual', () => {
    const { result } = renderHook(() => useChartTheme())

    expect(result.current.primary).toBeTruthy()
    expect(result.current.grid).toBeTruthy()
  })
})
