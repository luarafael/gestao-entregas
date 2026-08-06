import { entregaRepository } from '../repositories/entrega.repository.js'
import { rotaExecucaoRepository } from '../repositories/rota-execucao.repository.js'
import { rotaRepository } from '../repositories/rota.repository.js'
import type { StatusExecucaoParada } from '../schemas/rota-execucao.schema.js'
import { formatDateOnlyISO, toUtcDateOnly, toUtcDateOnlyFromBusinessTz } from '../utils/date.utils.js'

export interface MonitoramentoParada {
  paradaId: string
  ordem: number
  entregaId: string | null
  cliente: string | null
  endereco: string
  bairro: string | null
  telefone: string | null
  observacao: string | null
  status: StatusExecucaoParada
  dataHoraStatus: string | null
  statusObservacao: string | null
  distancia: number | null
  tempo: number | null
}

export interface MonitoramentoRota {
  rotaId: string
  enderecoInicial: string
  distanciaTotal: number
  tempoTotal: number
  distanciaRestante: number
  tempoRestante: number
  motoboyId: string | null
  motoboyNome: string
  totalParadas: number
  stats: {
    pendentes: number
    emRota: number
    entregues: number
    problemas: number
    percentual: number
  }
  proximaParada: {
    paradaId: string
    ordem: number
    cliente: string | null
    endereco: string
    bairro: string | null
    status: StatusExecucaoParada
    distancia: number | null
    tempo: number | null
  } | null
  paradas: MonitoramentoParada[]
}

export interface MonitoramentoEntregaAvulsa {
  id: string
  nomeCliente: string | null
  endereco: string
  bairro: string
  horario: string
  valorEntrega: number
  pagoPeloCliente: boolean
  motoboyId: string | null
  motoboyNome: string
}

export interface MonitoramentoGrupoAvulso {
  motoboyId: string | null
  motoboyNome: string
  entregas: MonitoramentoEntregaAvulsa[]
  totalEntregas: number
  valorTotal: number
}

function isProblemStatus(status: StatusExecucaoParada): boolean {
  return (
    status === 'CLIENTE_AUSENTE' ||
    status === 'NAO_LOCALIZADO' ||
    status === 'FALHA_ENTREGA'
  )
}

function computeStats(paradas: MonitoramentoParada[]) {
  const total = paradas.length
  let pendentes = 0
  let emRota = 0
  let entregues = 0
  let problemas = 0

  for (const parada of paradas) {
    if (parada.status === 'PENDENTE') pendentes += 1
    if (parada.status === 'EM_ROTA') emRota += 1
    if (parada.status === 'ENTREGUE') entregues += 1
    if (isProblemStatus(parada.status) || parada.status === 'CANCELADA') {
      problemas += 1
    }
  }

  const percentual = total > 0 ? Math.round((entregues / total) * 100) : 0

  return { total, pendentes, emRota, entregues, problemas, percentual }
}

function computeRemaining(paradas: MonitoramentoParada[]) {
  let distanciaRestante = 0
  let tempoRestante = 0

  for (const parada of paradas) {
    if (parada.status !== 'ENTREGUE') {
      distanciaRestante += parada.distancia ?? 0
      tempoRestante += parada.tempo ?? 0
    }
  }

  return { distanciaRestante, tempoRestante }
}

function getProximaParada(paradas: MonitoramentoParada[]) {
  const emRota = paradas.find((parada) => parada.status === 'EM_ROTA')
  if (emRota) return emRota

  return paradas.find((parada) => parada.status === 'PENDENTE') ?? null
}

function toProximaParada(parada: MonitoramentoParada) {
  return {
    paradaId: parada.paradaId,
    ordem: parada.ordem,
    cliente: parada.cliente,
    endereco: parada.endereco,
    bairro: parada.bairro,
    status: parada.status,
    distancia: parada.distancia,
    tempo: parada.tempo,
  }
}

export class MonitoramentoService {
  async getMonitoramento(reference?: Date | string) {
    const day =
      reference === undefined
        ? toUtcDateOnlyFromBusinessTz()
        : typeof reference === 'string'
          ? toUtcDateOnly(reference)
          : toUtcDateOnly(formatDateOnlyISO(reference))

    const [rotas, entregasDia] = await Promise.all([
      rotaRepository.findByDate(day),
      entregaRepository.findAllByDate(day),
    ])

    const entregaMap = new Map(entregasDia.map((entrega) => [entrega.id, entrega]))
    const entregaIdsEmRotas = new Set<string>()

    const rotasMonitoramento: MonitoramentoRota[] = []

    for (const rota of rotas) {
      for (const parada of rota.paradas) {
        if (parada.entregaId) {
          entregaIdsEmRotas.add(parada.entregaId)
        }
      }

      const execucoes = (await rotaExecucaoRepository.initForRota(rota.id)) ?? []
      const execucaoByParadaId = new Map(
        execucoes.map((execucao) => [execucao.paradaId, execucao]),
      )

      const paradas: MonitoramentoParada[] = rota.paradas.map((parada) => {
        const execucao = execucaoByParadaId.get(parada.id)

        return {
          paradaId: parada.id,
          ordem: parada.ordem,
          entregaId: parada.entregaId,
          cliente: parada.cliente,
          endereco: parada.endereco,
          bairro: parada.bairro,
          telefone: parada.telefone,
          observacao: parada.observacao,
          status: execucao?.status ?? 'PENDENTE',
          dataHoraStatus: execucao?.dataHoraStatus?.toISOString() ?? null,
          statusObservacao: execucao?.observacao ?? null,
          distancia: parada.distancia != null ? Number(parada.distancia) : null,
          tempo: parada.tempo ?? null,
        }
      })

      const stats = computeStats(paradas)
      const { distanciaRestante, tempoRestante } = computeRemaining(paradas)
      const proxima = getProximaParada(paradas)

      let motoboyId: string | null = null
      let motoboyNome = 'Sem motoboy'

      for (const parada of paradas) {
        if (!parada.entregaId) continue
        const entrega = entregaMap.get(parada.entregaId)
        if (entrega?.motoboy) {
          motoboyId = entrega.motoboy.id
          motoboyNome = entrega.motoboy.nome
          break
        }
      }

      rotasMonitoramento.push({
        rotaId: rota.id,
        enderecoInicial: rota.enderecoInicial,
        distanciaTotal: Number(rota.distanciaTotal),
        tempoTotal: rota.tempoTotal,
        distanciaRestante,
        tempoRestante,
        motoboyId,
        motoboyNome,
        totalParadas: paradas.length,
        stats: {
          pendentes: stats.pendentes,
          emRota: stats.emRota,
          entregues: stats.entregues,
          problemas: stats.problemas,
          percentual: stats.percentual,
        },
        proximaParada: proxima ? toProximaParada(proxima) : null,
        paradas,
      })
    }

    const entregasAvulsas = entregasDia.filter(
      (entrega) => !entregaIdsEmRotas.has(entrega.id),
    )

    const gruposMap = new Map<string, MonitoramentoGrupoAvulso>()

    for (const entrega of entregasAvulsas) {
      const key = entrega.motoboyId ?? 'sem-motoboy'
      const existing = gruposMap.get(key) ?? {
        motoboyId: entrega.motoboyId,
        motoboyNome: entrega.motoboy?.nome ?? 'Sem motoboy',
        entregas: [],
        totalEntregas: 0,
        valorTotal: 0,
      }

      existing.entregas.push({
        id: entrega.id,
        nomeCliente: entrega.nomeCliente,
        endereco: entrega.endereco,
        bairro: entrega.bairro,
        horario: entrega.horario.toISOString(),
        valorEntrega: Number(entrega.valorEntrega),
        pagoPeloCliente: entrega.pagoPeloCliente,
        motoboyId: entrega.motoboyId,
        motoboyNome: entrega.motoboy?.nome ?? 'Sem motoboy',
      })
      existing.totalEntregas += 1
      if (!entrega.pagoPeloCliente) {
        existing.valorTotal += Number(entrega.valorEntrega)
      }

      gruposMap.set(key, existing)
    }

    const entregasAvulsasGrupos = Array.from(gruposMap.values()).sort((a, b) =>
      a.motoboyNome.localeCompare(b.motoboyNome),
    )

    const resumoParadas = rotasMonitoramento.reduce(
      (acc, rota) => {
        acc.totalParadas += rota.totalParadas
        acc.entregues += rota.stats.entregues
        acc.emRota += rota.stats.emRota
        acc.pendentes += rota.stats.pendentes
        acc.problemas += rota.stats.problemas
        return acc
      },
      {
        totalRotas: rotasMonitoramento.length,
        totalParadas: 0,
        entregues: 0,
        emRota: 0,
        pendentes: 0,
        problemas: 0,
        entregasAvulsas: entregasAvulsas.length,
      },
    )

    return {
      data: formatDateOnlyISO(day),
      atualizadoEm: new Date().toISOString(),
      resumo: resumoParadas,
      rotas: rotasMonitoramento,
      entregasAvulsas: entregasAvulsasGrupos,
    }
  }
}

export const monitoramentoService = new MonitoramentoService()
