import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MonitoramentoService } from '../services/monitoramento.service.js'

const rotaRepository = vi.hoisted(() => ({
  findByDate: vi.fn(),
}))

const rotaExecucaoRepository = vi.hoisted(() => ({
  initForRota: vi.fn(),
}))

const entregaRepository = vi.hoisted(() => ({
  findAllByDate: vi.fn(),
}))

vi.mock('../repositories/rota.repository.js', () => ({
  rotaRepository,
}))

vi.mock('../repositories/rota-execucao.repository.js', () => ({
  rotaExecucaoRepository,
}))

vi.mock('../repositories/entrega.repository.js', () => ({
  entregaRepository,
}))

describe('MonitoramentoService', () => {
  const service = new MonitoramentoService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('monta rotas com status de execução e próxima parada', async () => {
    rotaRepository.findByDate.mockResolvedValue([
      {
        id: 'rota-1',
        enderecoInicial: 'Depósito',
        distanciaTotal: 5000,
        tempoTotal: 1200,
        paradas: [
          {
            id: 'p1',
            ordem: 1,
            entregaId: 'e1',
            cliente: 'Cliente A',
            endereco: 'Rua A, 1',
            bairro: 'Centro',
            telefone: null,
            observacao: null,
            distancia: 1000,
            tempo: 300,
          },
          {
            id: 'p2',
            ordem: 2,
            entregaId: 'e2',
            cliente: 'Cliente B',
            endereco: 'Rua B, 2',
            bairro: 'Jardim',
            telefone: null,
            observacao: null,
            distancia: 2000,
            tempo: 600,
          },
        ],
      },
    ])

    rotaExecucaoRepository.initForRota.mockResolvedValue([
      {
        paradaId: 'p1',
        status: 'ENTREGUE',
        observacao: null,
        dataHoraStatus: new Date('2026-08-05T14:00:00Z'),
      },
      {
        paradaId: 'p2',
        status: 'EM_ROTA',
        observacao: null,
        dataHoraStatus: new Date('2026-08-05T14:30:00Z'),
      },
    ])

    entregaRepository.findAllByDate.mockResolvedValue([
      {
        id: 'e1',
        nomeCliente: 'Cliente A',
        endereco: 'Rua A, 1',
        bairro: 'Centro',
        horario: new Date('2026-08-05T13:00:00Z'),
        valorEntrega: 15,
        pagoPeloCliente: false,
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
      {
        id: 'e2',
        nomeCliente: 'Cliente B',
        endereco: 'Rua B, 2',
        bairro: 'Jardim',
        horario: new Date('2026-08-05T14:00:00Z'),
        valorEntrega: 20,
        pagoPeloCliente: false,
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
      {
        id: 'e3',
        nomeCliente: 'Avulsa',
        endereco: 'Rua C, 3',
        bairro: 'Vila',
        horario: new Date('2026-08-05T15:00:00Z'),
        valorEntrega: 10,
        pagoPeloCliente: false,
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
    ])

    const result = await service.getMonitoramento('2026-08-05')

    expect(result.rotas).toHaveLength(1)
    expect(result.rotas[0]?.motoboyNome).toBe('João')
    expect(result.rotas[0]?.stats.entregues).toBe(1)
    expect(result.rotas[0]?.stats.emRota).toBe(1)
    expect(result.rotas[0]?.proximaParada?.paradaId).toBe('p2')
    expect(result.rotas[0]?.distanciaRestante).toBe(2000)
    expect(result.rotas[0]?.tempoRestante).toBe(600)
    expect(result.entregasAvulsas).toHaveLength(1)
    expect(result.entregasAvulsas[0]?.entregas).toHaveLength(1)
    expect(result.resumo.totalRotas).toBe(1)
    expect(result.resumo.entregasAvulsas).toBe(1)
  })
})
