import type { UserRole } from '../schemas/auth.schema'

export type { UserRole }

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN'
}

export function getRoleLabel(role: UserRole): string {
  return role === 'ADMIN' ? 'Administrador' : 'Motoboy'
}

export function canAccessAdminArea(role: UserRole): boolean {
  return isAdmin(role)
}

export const ADMIN_ONLY_ROUTES = ['/pendencias', '/prestacao', '/relatorios'] as const

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (isAdmin(role)) {
    return true
  }

  if (pathname === '/' || pathname === '') {
    return false
  }

  return !ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))
}

export function getDefaultHomePath(role: UserRole): string {
  return isAdmin(role) ? '/' : '/planejador'
}
