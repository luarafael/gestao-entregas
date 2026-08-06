import { NotFoundError } from '../errors/app.error.js'
import { rotaExecucaoRepository } from '../repositories/rota-execucao.repository.js'
import { rotaRepository } from '../repositories/rota.repository.js'
import type {
  BulkSyncExecucaoInput,
  UpdateExecucaoParadaInput,
} from '../schemas/rota-execucao.schema.js'

export class RotaExecucaoService {
  async getOrInit(rotaId: string) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    const execucoes = await rotaExecucaoRepository.initForRota(rotaId)
    return execucoes ?? []
  }

  async list(rotaId: string) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    return rotaExecucaoRepository.findByRotaId(rotaId)
  }

  async updateParada(
    rotaId: string,
    paradaId: string,
    input: UpdateExecucaoParadaInput,
  ) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    const parada = rota.paradas.find((item) => item.id === paradaId)
    if (!parada) {
      throw new NotFoundError('Parada não encontrada nesta rota')
    }

    await rotaExecucaoRepository.initForRota(rotaId)

    const result = await rotaExecucaoRepository.updateByParadaId(
      rotaId,
      paradaId,
      {
        status: input.status,
        observacao: input.observacao,
        dataHoraStatus: new Date(),
      },
    )

    if (result.count === 0) {
      throw new NotFoundError('Registro de execução não encontrado')
    }

    return rotaExecucaoRepository.findByRotaId(rotaId)
  }

  async bulkSync(rotaId: string, input: BulkSyncExecucaoInput) {
    const rota = await rotaRepository.findById(rotaId)
    if (!rota) {
      throw new NotFoundError('Rota não encontrada')
    }

    await rotaExecucaoRepository.initForRota(rotaId)

    const count = await rotaExecucaoRepository.bulkSync(rotaId, input.paradas)
    const execucoes = await rotaExecucaoRepository.findByRotaId(rotaId)

    return { count, execucoes }
  }
}

export const rotaExecucaoService = new RotaExecucaoService()
