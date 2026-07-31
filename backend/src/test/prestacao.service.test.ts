import { beforeEach, describe, it, expect, vi } from 'vitest'
import { PrestacaoService } from '../services/prestacao.service.js'
import { ConflictError, NotFoundError } from '../errors/app.error.js'

const prestacaoRepository = vi.hoisted(() => ({
  findByDate: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))

const entregaRepository = vi.hoisted(() => ({
  findByDate: vi.fn(),
  getStatsByDate: vi.fn(),
}))

const pendenciaRepository = vi.hoisted(() => ({
  findPendingByDate: vi.fn(),
}))

vi.mock('../repositories/prestacao.repository.js', () => ({
  prestacaoRepository,
}))

vi.mock('../repositories/entrega.repository.js', () => ({
  entregaRepository,
}))

vi.mock('../repositories/pendencia.repository.js', () => ({
  pendenciaRepository,
}))

describe('PrestacaoService', () => {
  const service = new PrestacaoService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera prestação do dia', async () => {
    prestacaoRepository.findByDate.mockResolvedValue(null)
    entregaRepository.findByDate.mockResolvedValue([
      {
        bairro: 'Centro',
        nomeCliente: 'João',
        valorEntrega: 25,
      },
    ])
    pendenciaRepository.findPendingByDate.mockResolvedValue([
      {
        descricao: 'Pendência',
        valor: 10,
        referenteAoDia: new Date('2026-07-12'),
      },
    ])
    entregaRepository.getStatsByDate.mockResolvedValue({
      totalEntregas: 1,
      valorTotal: 25,
    })
    prestacaoRepository.create.mockResolvedValue({
      id: '1',
      data: new Date('2026-07-31'),
      totalEntregas: 1,
      valorTotal: 25,
      valorPendencias: 10,
      valorFinal: 35,
    })

    const result = await service.generate({ data: new Date('2026-07-31') })

    expect(result.prestacao.valorFinal).toBe(35)
    expect(result.whatsappText).toContain('Prestação de Contas')
  })

  it('impede gerar prestação duplicada', async () => {
    prestacaoRepository.findByDate.mockResolvedValue({ id: '1' })

    await expect(service.generate({})).rejects.toBeInstanceOf(ConflictError)
  })

  it('lança NotFoundError ao buscar prestação inexistente', async () => {
    prestacaoRepository.findById.mockResolvedValue(null)

    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('retorna texto do WhatsApp para prestação existente', async () => {
    prestacaoRepository.findById.mockResolvedValue({
      id: '1',
      data: new Date('2026-07-31'),
      totalEntregas: 1,
      valorTotal: 25,
      valorPendencias: 0,
      valorFinal: 25,
    })
    entregaRepository.findByDate.mockResolvedValue([])
    pendenciaRepository.findPendingByDate.mockResolvedValue([])

    const text = await service.getWhatsAppText('1')

    expect(text).toContain('Valor Final:')
  })

  it('lista prestações paginadas', async () => {
    prestacaoRepository.findMany.mockResolvedValue({
      data: [{ id: '1' }],
      total: 1,
    })

    const result = await service.list({ page: 1, limit: 10 })

    expect(result.data).toHaveLength(1)
  })

  it('atualiza observações da prestação', async () => {
    prestacaoRepository.findById.mockResolvedValue({
      id: '1',
      data: new Date('2026-07-31'),
      observacoes: 'Antiga',
    })
    prestacaoRepository.update.mockResolvedValue({
      id: '1',
      observacoes: 'Nova',
    })

    const result = await service.update('1', { observacoes: 'Nova' })

    expect(result.observacoes).toBe('Nova')
  })

  it('exclui prestação existente', async () => {
    prestacaoRepository.findById.mockResolvedValue({ id: '1' })
    prestacaoRepository.delete.mockResolvedValue({ id: '1' })

    await expect(service.delete('1')).resolves.toEqual({ id: '1' })
  })
})
