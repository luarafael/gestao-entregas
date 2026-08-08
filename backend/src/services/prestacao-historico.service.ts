import { prestacaoClienteRepository } from '../repositories/prestacao-cliente.repository.js'
import { prestacaoMotoboyRepository } from '../repositories/prestacao-motoboy.repository.js'
import { prestacaoRepository } from '../repositories/prestacao.repository.js'
import type { ListHistoricoPrestacaoInput } from '../schemas/prestacao-cliente.schema.js'
import { formatDateOnlyISO } from '../utils/date.utils.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'

export type PrestacaoHistoricoTipo = 'empresa' | 'motoboy' | 'cliente'

export interface PrestacaoHistoricoItem {
  id: string
  tipo: PrestacaoHistoricoTipo
  data: string
  titulo: string
  subtitulo: string | null
  totalEntregas: number
  valorFinal: number
  status: string | null
  motivoRejeicao: string | null
}

const HISTORICO_FETCH_LIMIT = 500

export class PrestacaoHistoricoService {
  async list(filters: ListHistoricoPrestacaoInput) {
    const items: PrestacaoHistoricoItem[] = []

    if (filters.tipo === 'all' || filters.tipo === 'empresa') {
      const { data } = await prestacaoRepository.findMany(1, HISTORICO_FETCH_LIMIT)
      items.push(
        ...data.map((item) => ({
          id: item.id,
          tipo: 'empresa' as const,
          data: formatDateOnlyISO(item.data),
          titulo: 'Empresa',
          subtitulo: null,
          totalEntregas: item.totalEntregas,
          valorFinal: Number(item.valorFinal),
          status: null,
          motivoRejeicao: null,
        })),
      )
    }

    if (filters.tipo === 'all' || filters.tipo === 'motoboy') {
      const { data } = await prestacaoMotoboyRepository.findMany({
        page: 1,
        limit: HISTORICO_FETCH_LIMIT,
        ...(filters.motoboyId ? { motoboyId: filters.motoboyId } : {}),
      })
      items.push(
        ...data.map((item) => ({
          id: item.id,
          tipo: 'motoboy' as const,
          data: formatDateOnlyISO(item.data),
          titulo: item.motoboy.nome,
          subtitulo: 'Motoboy',
          totalEntregas: item.totalEntregas,
          valorFinal: Number(item.valorFinal),
          status: item.status,
          motivoRejeicao: item.motivoRejeicao,
        })),
      )
    }

    if (filters.tipo === 'all' || filters.tipo === 'cliente') {
      const { data } = await prestacaoClienteRepository.findMany(
        1,
        HISTORICO_FETCH_LIMIT,
        filters.nomeCliente,
      )
      items.push(
        ...data.map((item) => ({
          id: item.id,
          tipo: 'cliente' as const,
          data: formatDateOnlyISO(item.data),
          titulo: item.nomeCliente,
          subtitulo: 'Cliente',
          totalEntregas: item.totalEntregas,
          valorFinal: Number(item.valorFinal),
          status: null,
          motivoRejeicao: null,
        })),
      )
    }

    items.sort((a, b) => {
      const dateCompare = b.data.localeCompare(a.data)
      if (dateCompare !== 0) return dateCompare
      return a.titulo.localeCompare(b.titulo)
    })

    const total = items.length
    const start = (filters.page - 1) * filters.limit
    const paginated = items.slice(start, start + filters.limit)

    return buildPaginatedResult(paginated, total, filters.page, filters.limit)
  }
}

export const prestacaoHistoricoService = new PrestacaoHistoricoService()
