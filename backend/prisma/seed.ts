import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

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
