import 'dotenv/config'
import { env } from '../src/config/env.js'
import { ensureAdminUser } from '../src/bootstrap/ensure-admin.js'
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/utils/password.utils.js'
import { toUtcDateOnlyFromBusinessTz } from '../src/utils/date.utils.js'

async function main() {
  await ensureAdminUser()

  if (env.NODE_ENV === 'production') {
    console.log('Seed de desenvolvimento ignorado em produção.')
    return
  }

  const motoboyPassword = await hashPassword('motoboy123')
  await prisma.usuario.upsert({
    where: { email: 'motoboy@sistema.local' },
    update: {
      nome: 'Motoboy Demo',
      senhaHash: motoboyPassword,
      role: 'MOTOBOY',
      ativo: true,
    },
    create: {
      nome: 'Motoboy Demo',
      email: 'motoboy@sistema.local',
      senhaHash: motoboyPassword,
      role: 'MOTOBOY',
    },
  })
  console.log('Usuário motoboy garantido: motoboy@sistema.local')

  const today = toUtcDateOnlyFromBusinessTz(new Date())
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)

  await prisma.entrega.createMany({
    data: [
      {
        data: today,
        horario: new Date(),
        nomeCliente: 'João Silva',
        endereco: 'Rua das Flores, 123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        valorEntrega: 25.0,
        observacao: 'Entregar na portaria',
      },
      {
        data: today,
        horario: new Date(Date.now() - 3600000),
        nomeCliente: 'Maria Santos',
        endereco: 'Av. Paulista, 1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        valorEntrega: 30.0,
      },
      {
        data: today,
        horario: new Date(Date.now() - 7200000),
        endereco: 'Rua Augusta, 500',
        bairro: 'Consolação',
        valorEntrega: 20.0,
      },
    ],
  })

  await prisma.pendencia.createMany({
    data: [
      {
        descricao: 'Pagamento pendente do dia 12/07',
        valor: 25.0,
        referenteAoDia: yesterday,
        status: 'PENDENTE',
      },
      {
        descricao: 'Taxa extra de entrega',
        valor: 15.0,
        referenteAoDia: today,
        status: 'PENDENTE',
      },
    ],
  })

  console.log('Seed executado com sucesso!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
