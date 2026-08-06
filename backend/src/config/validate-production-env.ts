const WEAK_JWT_SECRETS = new Set([
  'dev-only-change-in-production',
  'altere-este-segredo-em-producao',
])

export function validateProductionEnv(config: {
  NODE_ENV: string
  JWT_SECRET: string
  ADMIN_PASSWORD: string
}) {
  if (config.NODE_ENV !== 'production') {
    return
  }

  if (
    WEAK_JWT_SECRETS.has(config.JWT_SECRET) ||
    config.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'JWT_SECRET inseguro em produção. Defina um segredo com pelo menos 32 caracteres nas variáveis do Railway.',
    )
  }

  if (config.ADMIN_PASSWORD === 'admin123') {
    console.warn(
      'AVISO: ADMIN_PASSWORD padrão em produção. Altere ADMIN_PASSWORD no Railway.',
    )
  }
}
