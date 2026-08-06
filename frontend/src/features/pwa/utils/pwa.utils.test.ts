import { describe, it, expect, beforeEach } from 'vitest'
import {
  dismissPwaInstallPrompt,
  isIosDevice,
  isMobileDevice,
  isPwaInstallDismissed,
  isStandalonePwa,
} from './pwa.utils'

describe('pwa.utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste dismiss do prompt', () => {
    expect(isPwaInstallDismissed()).toBe(false)
    dismissPwaInstallPrompt()
    expect(isPwaInstallDismissed()).toBe(true)
  })

  it('detecta mobile', () => {
    expect(isMobileDevice()).toBe(false)
  })

  it('detecta ios', () => {
    expect(isIosDevice()).toBe(false)
  })

  it('detecta standalone', () => {
    expect(isStandalonePwa()).toBe(false)
  })
})
