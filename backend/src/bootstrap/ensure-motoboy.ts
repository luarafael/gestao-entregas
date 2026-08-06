import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { authService } from '../services/auth.service.js'

export async function ensureMotoboyUser() {
  const { MOTOBOY_EMAIL, MOTOBOY_PASSWORD, MOTOBOY_NAME } = env

  if (!MOTOBOY_EMAIL || !MOTOBOY_PASSWORD) {
    console.log(
      'MOTOBOY_EMAIL/MOTOBOY_PASSWORD não configurados — usuário motoboy de deploy ignorado.',
    )
    return
  }

  await authService.ensureMotoboyUser({
    nome: MOTOBOY_NAME,
    email: MOTOBOY_EMAIL,
    password: MOTOBOY_PASSWORD,
  })

  console.log(`Usuário motoboy garantido: ${MOTOBOY_EMAIL}`)
}

const isDirectRun = process.argv[1]?.includes('ensure-motoboy')

if (isDirectRun) {
  ensureMotoboyUser()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
