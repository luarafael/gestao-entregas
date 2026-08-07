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

function isStopAtiva(status: StatusExecucaoParada): boolean {
  return status === 'PENDENTE' || status === 'EM_ROTA'
}

export function isRotaConcluida(paradas: MonitoramentoParada[]): boolean {
  if (paradas.length === 0) return false
  return paradas.every((parada) => !isStopAtiva(parada.status))
}

export function isRotaEmExecucao(paradas: MonitoramentoParada[]): boolean {
  if (paradas.length === 0) return false
  if (isRotaConcluida(paradas)) return false
  return paradas.some((parada) => parada.status !== 'PENDENTE')
}

/** Rota salva/planejada ou em andamento — qualquer execução que ainda não terminou. */
export function isRotaAtiva(paradas: MonitoramentoParada[]): boolean {
  if (paradas.length === 0) return false
  return !isRotaConcluida(paradas)
}

function rotaPertenceAoMotoboy(
  paradas: MonitoramentoParada[],
  entregaMap: Map<string, { motoboy?: { id: string; nome: string } | null }>,
  motoboyId: string,
): boolean {
  return paradas.some((parada) => {
    if (!parada.entregaId) return false
    return entregaMap.get(parada.entregaId)?.motoboy?.id === motoboyId
  })
}

function rotaMatchesMotoboy(
  rota: { motoboyId?: string | null },
  paradas: MonitoramentoParada[],
  entregaMap: Map<string, { motoboy?: { id: string; nome: string } | null }>,
  motoboyId: string,
): boolean {
  if (rota.motoboyId === motoboyId) {
    return true
  }

  return rotaPertenceAoMotoboy(paradas, entregaMap, motoboyId)
}

function getConcluidaEm(paradas: MonitoramentoParada[]): string | null {
  const timestamps = paradas
    .map((parada) => parada.dataHoraStatus)
    .filter((value): value is string => value != null)

  if (timestamps.length === 0) return null

  return timestamps.reduce((latest, current) =>
    current > latest ? current : latest,
  )
}

function buildMonitoramentoRota(
  rota: {
    id: string
    enderecoInicial: string
    distanciaTotal: unknown
    tempoTotal: number
    motoboyId?: string | null
    motoboy?: { id: string; nome: string } | null
  },
  paradas: MonitoramentoParada[],
  entregaMap: Map<string, { motoboy?: { id: string; nome: string } | null }>,
): MonitoramentoRota {
  const stats = computeStats(paradas)
  const { distanciaRestante, tempoRestante } = computeRemaining(paradas)
  const proxima = getProximaParada(paradas)

  let motoboyId = rota.motoboyId ?? null
  let motoboyNome = rota.motoboy?.nome ?? 'Sem motoboy'

  if (!motoboyId) {
    for (const parada of paradas) {
      if (!parada.entregaId) continue
      const entrega = entregaMap.get(parada.entregaId)
      if (entrega?.motoboy) {
        motoboyId = entrega.motoboy.id
        motoboyNome = entrega.motoboy.nome
        break
      }
    }
  }

  return {
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
  }
}

export interface MonitoramentoRotaHistorico extends MonitoramentoRota {
  concluidaEm: string | null
}

export class MonitoramentoService {
  async getMonitoramento(reference?: Date | string, motoboyId?: string) {
    const day =
      reference === undefined
        ? toUtcDateOnlyFromBusinessTz()
        : typeof reference === 'string'
          ? toUtcDateOnly(reference)
          : toUtcDateOnly(formatDateOnlyISO(reference))

    const rotas = await rotaRepository.findByDate(day)

    const entregaIds = [
      ...new Set(
        rotas.flatMap((rota) =>
          rota.paradas
            .map((parada) => parada.entregaId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    ]

    const [entregasDia, entregasVinculadas] = await Promise.all([
      entregaRepository.findAllByDate(day),
      entregaRepository.findByIds(entregaIds),
    ])

    const entregaMap = new Map<string, (typeof entregasDia)[number]>()
    for (const entrega of [...entregasDia, ...entregasVinculadas]) {
      entregaMap.set(entrega.id, entrega)
    }

    const rotasAtivas: MonitoramentoRota[] = []
    const historico: MonitoramentoRotaHistorico[] = []

    for (const rota of rotas) {
      if (rota.paradas.length === 0) {
        continue
      }

      let execucoes = await rotaExecucaoRepository.findByRotaId(rota.id)

      if (execucoes.length === 0) {
        const inited = await rotaExecucaoRepository.initForRota(rota.id)
        execucoes = inited ?? []
      }

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

      const rotaMonitoramento = buildMonitoramentoRota(rota, paradas, entregaMap)

      if (
        motoboyId &&
        !rotaMatchesMotoboy(rota, paradas, entregaMap, motoboyId)
      ) {
        continue
      }

      if (isRotaConcluida(paradas)) {
        historico.push({
          ...rotaMonitoramento,
          concluidaEm: getConcluidaEm(paradas),
        })
        continue
      }

      if (isRotaAtiva(paradas)) {
        rotasAtivas.push(rotaMonitoramento)
      }
    }

    historico.sort((a, b) => {
      const aTime = a.concluidaEm ?? ''
      const bTime = b.concluidaEm ?? ''
      return bTime.localeCompare(aTime)
    })

    const resumo = rotasAtivas.reduce(
      (acc, rota) => {
        acc.totalParadas += rota.totalParadas
        acc.entregues += rota.stats.entregues
        acc.emRota += rota.stats.emRota
        acc.pendentes += rota.stats.pendentes
        acc.problemas += rota.stats.problemas
        return acc
      },
      {
        totalRotas: rotasAtivas.length,
        totalParadas: 0,
        entregues: 0,
        emRota: 0,
        pendentes: 0,
        problemas: 0,
        rotasConcluidas: historico.length,
      },
    )

    return {
      data: formatDateOnlyISO(day),
      atualizadoEm: new Date().toISOString(),
      resumo,
      rotas: rotasAtivas,
      historico,
    }
  }
}

export const monitoramentoService = new MonitoramentoService()
