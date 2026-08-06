const TOKEN_STORAGE_KEY = 'gestao-entregas.auth-token'
const SESSION_STORAGE_KEY = 'gestao-entregas.auth-session'

let memoryToken: string | null = null

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return memoryToken
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return memoryToken ?? readStoredToken()
}

export function setAccessToken(token: string | null): void {
  memoryToken = token
  if (typeof window === 'undefined') return

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function clearAuthSessionStorage(): void {
  setAccessToken(null)
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
