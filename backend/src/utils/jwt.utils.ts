import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthTokenPayload {
  sub: string
  email: string
  role: 'ADMIN' | 'OPERADOR'
  nome: string
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}
