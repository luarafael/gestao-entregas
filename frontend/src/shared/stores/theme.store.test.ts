import { beforeEach, describe, it, expect } from 'vitest'
import { useThemeStore } from './theme.store'

describe('theme store', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' })
  })

  it('alterna tema', () => {
    useThemeStore.getState().toggleTheme()

    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('define tema explicitamente', () => {
    useThemeStore.getState().setTheme('dark')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
