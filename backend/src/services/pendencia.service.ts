import { NotFoundError } from '../errors/app.error.js'
import { pendenciaRepository } from '../repositories/pendencia.repository.js'
import type {
  CreatePendenciaInput,
  ListPendenciasInput,
  UpdatePendenciaInput,
} from '../schemas/pendencia.schema.js'
import { buildPaginatedResult } from '../utils/pagination.utils.js'

export class PendenciaService {
  async create(input: CreatePendenciaInput) {
    return pendenciaRepository.create(input)
  }

  async findById(id: string) {
    const pendencia = await pendenciaRepository.findById(id)
    if (!pendencia) {
      throw new NotFoundError('Pendência não encontrada')
    }
    return pendencia
  }

  async list(filters: ListPendenciasInput) {
    const { data, total } = await pendenciaRepository.findMany(filters)
    return buildPaginatedResult(data, total, filters.page, filters.limit)
  }

  async update(id: string, input: UpdatePendenciaInput) {
    await this.findById(id)
    return pendenciaRepository.update(id, input)
  }

  async delete(id: string) {
    await this.findById(id)
    return pendenciaRepository.delete(id)
  }
}

export const pendenciaService = new PendenciaService()
