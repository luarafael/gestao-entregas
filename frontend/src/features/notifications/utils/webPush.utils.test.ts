import { describe, expect, it } from 'vitest'
import {
  applicationServerKeysMatch,
  urlBase64ToUint8Array,
} from './webPush.utils'

describe('urlBase64ToUint8Array', () => {
  it('converte chave VAPID base64 url-safe', () => {
    const input = 'BMkK8mG5Xh2Y'
    const bytes = urlBase64ToUint8Array(input)

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })
})

describe('applicationServerKeysMatch', () => {
  it('aceita a mesma chave VAPID', () => {
    const vapidPublicKey = 'BMkK8mG5Xh2Y'
    const bytes = urlBase64ToUint8Array(vapidPublicKey)

    expect(applicationServerKeysMatch(bytes.buffer, vapidPublicKey)).toBe(true)
  })

  it('rejeita chave ausente ou diferente', () => {
    const vapidPublicKey = 'BMkK8mG5Xh2Y'

    expect(applicationServerKeysMatch(null, vapidPublicKey)).toBe(false)
    expect(
      applicationServerKeysMatch(
        urlBase64ToUint8Array('AAAA').buffer,
        vapidPublicKey,
      ),
    ).toBe(false)
  })
})
