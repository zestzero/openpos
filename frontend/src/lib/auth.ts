export type UserRole = 'owner' | 'cashier'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
}

interface StoredSession {
  token: string
  user: AuthUser
}

interface JwtPayload {
  user_id?: string
  sub?: string
  email?: string
  role?: UserRole
  exp?: number
  iat?: number
}

const TOKEN_KEY = 'openpos:token'
const USER_KEY = 'openpos:user'

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

function removeStorage(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export function setToken(token: string) {
  writeStorage(TOKEN_KEY, token)
}

export function getToken() {
  return readStorage(TOKEN_KEY)
}

export function clearToken() {
  removeStorage(TOKEN_KEY)
}

export function setStoredUser(user: AuthUser) {
  writeStorage(USER_KEY, JSON.stringify(user))
}

export function getStoredUser() {
  const raw = readStorage(USER_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const normalized: AuthUser = {
      id: parsed.id ?? parsed.ID ?? '',
      email: parsed.email ?? parsed.Email ?? '',
      role: (parsed.role ?? parsed.Role ?? 'cashier') as UserRole,
      name: parsed.name ?? parsed.Name ?? '',
    }
    return normalized
  } catch {
    return null
  }
}

export function clearStoredUser() {
  removeStorage(USER_KEY)
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(normalized)

    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getUserFromToken(token: string): AuthUser | null {
  const payload = decodeToken(token)
  if (!payload?.role || !payload.email) return null

  return {
    id: payload.user_id ?? payload.sub ?? '',
    email: payload.email,
    role: payload.role,
    name: payload.email,
  }
}

export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload) return false
  if (!payload.exp) return true
  return payload.exp * 1000 > Date.now()
}

export function hasRole(role: UserRole, expected: UserRole | UserRole[]) {
  return Array.isArray(expected) ? expected.includes(role) : role === expected
}

export function getRedirectPath(_role: UserRole) {
  return _role === 'owner' ? '/erp' : '/pos'
}

export function getStoredSession(): StoredSession | null {
  const token = getToken()
  if (!token || !isTokenValid(token)) {
    clearToken()
    clearStoredUser()
    return null
  }

  const cachedUser = getStoredUser()
  const derivedUser = getUserFromToken(token)
  const user = cachedUser ?? derivedUser

  if (!user) return null

  return { token, user }
}

export function persistSession(session: StoredSession) {
  setToken(session.token)
  setStoredUser(session.user)
}

export function clearSession() {
  clearToken()
  clearStoredUser()
}

export function isAuthenticated() {
  return Boolean(getStoredSession())
}
