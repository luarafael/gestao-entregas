import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('atualiza valor após delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'abc' })

    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('abc')
  })
})
