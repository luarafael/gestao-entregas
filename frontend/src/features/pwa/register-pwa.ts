export async function registerPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return
  }

  const { registerSW } = await import('virtual:pwa-register')
  registerSW({ immediate: true })
}
