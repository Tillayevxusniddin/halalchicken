const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const isBrowser =
  typeof window !== 'undefined' && typeof localStorage !== 'undefined'

export function getAccessToken(): string | null {
  if (!isBrowser) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthTokens(access: string, refresh: string): void {
  if (!isBrowser) return
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearAuthTokens(): void {
  if (!isBrowser) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
