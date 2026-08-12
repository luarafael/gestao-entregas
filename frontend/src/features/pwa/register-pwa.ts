let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return Promise.resolve(null)
  }

  if (!registrationPromise) {
    registrationPromise = (async () => {
      const { registerSW } = await import('virtual:pwa-register')
      registerSW({ immediate: true })
      return navigator.serviceWorker.ready
    })()
  }

  return registrationPromise
}

export async function registerPwa() {
  await getServiceWorkerRegistration()
}
