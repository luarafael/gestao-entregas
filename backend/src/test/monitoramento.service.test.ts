import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isRotaConcluida,
  isRotaEmExecucao,
  MonitoramentoService,
  type MonitoramentoParada,
} from '../services/monitoramento.service.js'

const rotaRepository = vi.hoisted(() => ({
  findByDate: vi.fn(),
}))

const rotaExecucaoRepository = vi.hoisted(() => ({
  findByRotaId: vi.fn(),
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

function parada(
  id: string,
  status: MonitoramentoParada['status'],
): MonitoramentoParada {
  return {
    paradaId: id,
    ordem: 1,
    entregaId: null,
    cliente: 'Cliente',
    endereco: 'Rua 1',
    bairro: 'Centro',
    telefone: null,
    observacao: null,
    status,
    dataHoraStatus: null,
    statusObservacao: null,
    distancia: 1000,
    tempo: 300,
  }
}

describe('MonitoramentoService', () => {
  const service = new MonitoramentoService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('identifica rota em execução e concluída', () => {
    expect(isRotaEmExecucao([parada('p1', 'EM_ROTA'), parada('p2', 'PENDENTE')])).toBe(
      true,
    )
    expect(isRotaConcluida([parada('p1', 'ENTREGUE'), parada('p2', 'ENTREGUE')])).toBe(
      true,
    )
    expect(isRotaEmExecucao([parada('p1', 'PENDENTE'), parada('p2', 'PENDENTE')])).toBe(
      false,
    )
  })

  it('mostra apenas rotas em andamento e move concluídas para histórico', async () => {
    rotaRepository.findByDate.mockResolvedValue([
      {
        id: 'rota-ativa',
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
      {
        id: 'rota-concluida',
        enderecoInicial: 'Depósito',
        distanciaTotal: 3000,
        tempoTotal: 900,
        paradas: [
          {
            id: 'p3',
            ordem: 1,
            entregaId: 'e3',
            cliente: 'Cliente C',
            endereco: 'Rua C, 3',
            bairro: 'Vila',
            telefone: null,
            observacao: null,
            distancia: 3000,
            tempo: 900,
          },
        ],
      },
      {
        id: 'rota-salva',
        enderecoInicial: 'Depósito',
        distanciaTotal: 1000,
        tempoTotal: 300,
        paradas: [
          {
            id: 'p4',
            ordem: 1,
            entregaId: null,
            cliente: 'Cliente D',
            endereco: 'Rua D, 4',
            bairro: 'Leste',
            telefone: null,
            observacao: null,
            distancia: 1000,
            tempo: 300,
          },
        ],
      },
    ])

    rotaExecucaoRepository.findByRotaId.mockImplementation(async (rotaId: string) => {
      if (rotaId === 'rota-ativa') {
        return [
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
        ]
      }

      if (rotaId === 'rota-concluida') {
        return [
          {
            paradaId: 'p3',
            status: 'ENTREGUE',
            observacao: null,
            dataHoraStatus: new Date('2026-08-05T12:00:00Z'),
          },
        ]
      }

      return []
    })

    entregaRepository.findAllByDate.mockResolvedValue([
      {
        id: 'e1',
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
      {
        id: 'e2',
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
      {
        id: 'e3',
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
    ])

    const result = await service.getMonitoramento('2026-08-05')

    expect(result.rotas).toHaveLength(1)
    expect(result.rotas[0]?.rotaId).toBe('rota-ativa')
    expect(result.historico).toHaveLength(1)
    expect(result.historico[0]?.rotaId).toBe('rota-concluida')
    expect(result.resumo.totalRotas).toBe(1)
    expect(result.resumo.rotasConcluidas).toBe(1)
  })

  it('filtra monitoramento por motoboy', async () => {
    rotaRepository.findByDate.mockResolvedValue([
      {
        id: 'rota-joao',
        enderecoInicial: 'Depósito',
        distanciaTotal: 1000,
        tempoTotal: 300,
        paradas: [
          {
            id: 'p1',
            ordem: 1,
            entregaId: 'e1',
            cliente: 'A',
            endereco: 'Rua A',
            bairro: 'Centro',
            telefone: null,
            observacao: null,
            distancia: 1000,
            tempo: 300,
          },
        ],
      },
      {
        id: 'rota-maria',
        enderecoInicial: 'Depósito',
        distanciaTotal: 2000,
        tempoTotal: 600,
        paradas: [
          {
            id: 'p2',
            ordem: 1,
            entregaId: 'e2',
            cliente: 'B',
            endereco: 'Rua B',
            bairro: 'Jardim',
            telefone: null,
            observacao: null,
            distancia: 2000,
            tempo: 600,
          },
        ],
      },
    ])

    rotaExecucaoRepository.findByRotaId.mockImplementation(async (rotaId: string) => {
      if (rotaId === 'rota-joao') {
        return [
          {
            paradaId: 'p1',
            status: 'EM_ROTA',
            observacao: null,
            dataHoraStatus: new Date('2026-08-05T14:00:00Z'),
          },
        ]
      }

      return [
        {
          paradaId: 'p2',
          status: 'EM_ROTA',
          observacao: null,
          dataHoraStatus: new Date('2026-08-05T14:00:00Z'),
        },
      ]
    })

    entregaRepository.findAllByDate.mockResolvedValue([
      {
        id: 'e1',
        motoboyId: 'm1',
        motoboy: { id: 'm1', nome: 'João' },
      },
      {
        id: 'e2',
        motoboyId: 'm2',
        motoboy: { id: 'm2', nome: 'Maria' },
      },
    ])

    const result = await service.getMonitoramento('2026-08-05', 'm1')

    expect(result.rotas).toHaveLength(1)
    expect(result.rotas[0]?.rotaId).toBe('rota-joao')
    expect(result.rotas[0]?.motoboyNome).toBe('João')
  })
})
