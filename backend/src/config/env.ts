import { config } from 'dotenv'

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
} as const
