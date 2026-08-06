import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { ForbiddenError } from '../errors/app.error.js'

export function isAdminUser(user: AuthenticatedUser): boolean {
  return user.role === 'ADMIN'
}

export function resolveMotoboyScope(
  user: AuthenticatedUser,
  requestedMotoboyId?: string,
): string | undefined {
  if (isAdminUser(user)) {
    return requestedMotoboyId
  }

  if (requestedMotoboyId && requestedMotoboyId !== user.id) {
    throw new ForbiddenError('Você só pode acessar seus próprios dados')
  }

  return user.id
}

export function assertOwnsResource(
  user: AuthenticatedUser,
  resourceMotoboyId: string | null | undefined,
  message = 'Você não tem permissão para acessar este recurso',
) {
  if (isAdminUser(user)) {
    return
  }

  if (!resourceMotoboyId || resourceMotoboyId !== user.id) {
    throw new ForbiddenError(message)
  }
}
