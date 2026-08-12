import { describe, expect, it } from 'vitest'
import { urlBase64ToUint8Array } from './webPush.utils'

describe('urlBase64ToUint8Array', () => {
  it('converte chave VAPID base64 url-safe', () => {
    const input = 'BMkK8mG5Xh2Y'
    const bytes = urlBase64ToUint8Array(input)

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })
})
