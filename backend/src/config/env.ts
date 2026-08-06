import { config } from 'dotenv'
import { validateProductionEnv, warnWeakMotoboyPassword } from './validate-production-env.js'

config()

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const env = {
  DATABASE_URL: getEnv('DATABASE_URL'),
  PORT: Number(getEnv('PORT', '3001')),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
  JWT_SECRET: getEnv('JWT_SECRET', 'dev-only-change-in-production'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  ADMIN_EMAIL: getEnv('ADMIN_EMAIL', 'admin@sistema.local'),
  ADMIN_PASSWORD: getEnv('ADMIN_PASSWORD', 'admin123'),
  ADMIN_NAME: getEnv('ADMIN_NAME', 'Administrador'),
  MOTOBOY_EMAIL: process.env.MOTOBOY_EMAIL ?? '',
  MOTOBOY_PASSWORD: process.env.MOTOBOY_PASSWORD ?? '',
  MOTOBOY_NAME: process.env.MOTOBOY_NAME ?? 'Motoboy',
} as const

validateProductionEnv(env)
warnWeakMotoboyPassword(env)
