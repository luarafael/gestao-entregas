import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { authService } from '../services/auth.service.js'

export async function ensureAdminUser() {
  await authService.ensureAdminUser({
    nome: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  })
  console.log(`Usuário admin garantido: ${env.ADMIN_EMAIL}`)
}

const isDirectRun = process.argv[1]?.includes('ensure-admin')

if (isDirectRun) {
  ensureAdminUser()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
