import type { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../errors/app.error.js'
import { verifyAuthToken, type AuthTokenPayload } from '../utils/jwt.utils.js'

export type UserRole = AuthTokenPayload['role']

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  nome: string
}

function normalizeRole(role: string): UserRole {
  if (role === 'OPERADOR') {
    return 'MOTOBOY'
  }

  return role as UserRole
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      throw new UnauthorizedError('Token de autenticação ausente')
    }

    const payload = verifyAuthToken(token)
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: normalizeRole(payload.role),
      nome: payload.nome,
    }
    next()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error)
      return
    }
    next(new UnauthorizedError('Token inválido ou expirado'))
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Usuário não autenticado'))
      return
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError())
      return
    }

    next()
  }
}
