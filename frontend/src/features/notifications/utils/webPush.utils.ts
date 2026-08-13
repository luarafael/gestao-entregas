export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

export function applicationServerKeysMatch(
  existing: ArrayBuffer | null | undefined,
  vapidPublicKey: string,
): boolean {
  if (!existing) {
    return false
  }

  const current = new Uint8Array(existing)
  const expected = urlBase64ToUint8Array(vapidPublicKey)

  if (current.length !== expected.length) {
    return false
  }

  return current.every((byte, index) => byte === expected[index])
}
