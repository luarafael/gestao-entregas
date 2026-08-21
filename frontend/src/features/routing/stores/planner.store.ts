import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  OptimizedRouteResult,
  PlannerStop,
  RotaPlanejada,
  StatusExecucao,
} from '../schemas/routing.schema'
import {
  buildHistoricoEntry,
  mergeExecucoesIntoStops,
  withDefaultStatus,
  type ExecucaoHistoricoItem,
} from '../utils/executionStatus'

type ExecucaoParada = {
  paradaId: string | null
  status: string
  observacao: string | null
  dataHoraStatus: string | null
}

interface PlannerState {
  stops: PlannerStop[]
  result: OptimizedRouteResult | null
  savedRotaId: string | null
  reorderLocked: boolean
  orderDirty: boolean
  autoRecalc: boolean
  historicoExecucao: ExecucaoHistoricoItem[]
  progressUpdatedAt: string
  tab: 'planejar' | 'historico'
  selectedTempId: string | null

  setStops: (
    stops: PlannerStop[] | ((prev: PlannerStop[]) => PlannerStop[]),
  ) => void
  setResult: (
    result:
      | OptimizedRouteResult
      | null
      | ((
          prev: OptimizedRouteResult | null,
        ) => OptimizedRouteResult | null),
  ) => void
  setSavedRotaId: (id: string | null) => void
  setReorderLocked: (locked: boolean) => void
  setOrderDirty: (dirty: boolean) => void
  setAutoRecalc: (value: boolean) => void
  setHistoricoExecucao: (
    items:
      | ExecucaoHistoricoItem[]
      | ((prev: ExecucaoHistoricoItem[]) => ExecucaoHistoricoItem[]),
  ) => void
  setProgressUpdatedAt: (value: string) => void
  setTab: (tab: 'planejar' | 'historico') => void
  setSelectedTempId: (id: string | null) => void

  syncStops: (updated: PlannerStop[]) => void
  resetRoutePlanning: () => void
  clearActiveRoute: () => void
  hydrateFromRota: (
    rota: RotaPlanejada,
    execucoes?: ExecucaoParada[],
    options?: {
      tab?: 'planejar' | 'historico'
      preserveLocalEdits?: boolean
    },
  ) => void
}

const plannerInitialState = {
  stops: [] as PlannerStop[],
  result: null as OptimizedRouteResult | null,
  savedRotaId: null as string | null,
  reorderLocked: false,
  orderDirty: false,
  autoRecalc: true,
  historicoExecucao: [] as ExecucaoHistoricoItem[],
  progressUpdatedAt: new Date().toISOString(),
  tab: 'planejar' as const,
  selectedTempId: null as string | null,
}

function mapRotaToStops(
  rota: RotaPlanejada,
  execucoes: ExecucaoParada[] = [],
): PlannerStop[] {
  const loaded: PlannerStop[] = rota.paradas.map((parada) => ({
    tempId: parada.id,
    paradaId: parada.id,
    entregaId: parada.entregaId,
    cliente: parada.cliente,
    endereco: parada.endereco,
    bairro: parada.bairro,
    telefone: parada.telefone ?? null,
    observacao: parada.observacao,
    prioridade: parada.prioridade,
    ordemUrgencia: parada.ordemUrgencia ?? null,
    valorEntrega: parada.valorEntrega ? Number(parada.valorEntrega) : null,
    ordem: parada.ordem,
    distancia: parada.distancia != null ? Number(parada.distancia) : null,
    tempo: parada.tempo,
    latitude: parada.latitude,
    longitude: parada.longitude,
    statusExecucao: 'PENDENTE' as StatusExecucao,
  }))

  for (const execucao of execucoes) {
    const index = loaded.findIndex((stop) => stop.paradaId === execucao.paradaId)
    if (index === -1) continue
    loaded[index] = {
      ...loaded[index]!,
      statusExecucao: execucao.status as StatusExecucao,
      statusObservacao: execucao.observacao,
      statusAtualizadoEm: execucao.dataHoraStatus,
    }
  }

  return loaded.map(withDefaultStatus)
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      ...plannerInitialState,

      setStops: (updater) => {
        set((state) => ({
          stops:
            typeof updater === 'function' ? updater(state.stops) : updater,
        }))
      },

      setResult: (updater) => {
        set((state) => ({
          result:
            typeof updater === 'function' ? updater(state.result) : updater,
        }))
      },

      setSavedRotaId: (id) => set({ savedRotaId: id }),
      setReorderLocked: (locked) => set({ reorderLocked: locked }),
      setOrderDirty: (dirty) => set({ orderDirty: dirty }),
      setAutoRecalc: (value) => set({ autoRecalc: value }),
      setHistoricoExecucao: (updater) => {
        set((state) => ({
          historicoExecucao:
            typeof updater === 'function'
              ? updater(state.historicoExecucao)
              : updater,
        }))
      },
      setProgressUpdatedAt: (value) => set({ progressUpdatedAt: value }),
      setTab: (tab) => set({ tab }),
      setSelectedTempId: (id) => set({ selectedTempId: id }),

      syncStops: (updated) => {
        const normalized = updated.map(withDefaultStatus)
        set((state) => ({
          stops: normalized,
          result: state.result
            ? { ...state.result, paradas: normalized }
            : state.result,
        }))
      },

      resetRoutePlanning: () => {
        set((state) => ({
          orderDirty: state.stops.length > 0,
          reorderLocked: false,
        }))
      },

      clearActiveRoute: () => {
        set((state) => ({
          stops: [],
          result: null,
          savedRotaId: null,
          reorderLocked: false,
          orderDirty: false,
          historicoExecucao: [],
          progressUpdatedAt: new Date().toISOString(),
          selectedTempId: null,
          tab: 'historico',
          autoRecalc: state.autoRecalc,
        }))
      },

      hydrateFromRota: (rota, execucoes = [], options) => {
        set((state) => {
          const preserveLocalEdits = options?.preserveLocalEdits === true
          const keepLocalSequence =
            preserveLocalEdits &&
            state.stops.length > 0 &&
            (!state.reorderLocked || state.orderDirty)

          const loaded = keepLocalSequence
            ? mergeExecucoesIntoStops(state.stops, execucoes).map(
                withDefaultStatus,
              )
            : mapRotaToStops(rota, execucoes)

          const historicoExecucao = loaded
            .filter((stop) => stop.statusAtualizadoEm)
            .map((stop) => buildHistoricoEntry(stop))
          const latestStatusUpdate = loaded
            .map((stop) => stop.statusAtualizadoEm)
            .filter((value): value is string => Boolean(value))
            .sort()
            .at(-1)

          return {
            savedRotaId: rota.id,
            stops: loaded,
            result:
              keepLocalSequence && state.result
                ? { ...state.result, paradas: loaded }
                : {
                    enderecoInicial: rota.enderecoInicial,
                    origem: null,
                    distanciaTotal: Number(rota.distanciaTotal),
                    tempoTotal: rota.tempoTotal,
                    totalEntregas: loaded.length,
                    aproximada: rota.aproximada,
                    polyline: null,
                    sugestoes: [],
                    paradas: loaded,
                  },
            reorderLocked: preserveLocalEdits ? state.reorderLocked : true,
            orderDirty: preserveLocalEdits ? state.orderDirty : false,
            historicoExecucao,
            progressUpdatedAt:
              latestStatusUpdate ?? state.progressUpdatedAt,
            tab: options?.tab ?? state.tab,
          }
        })
      },
    }),
    {
      name: 'sistema-rotas-planner-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        stops: state.stops,
        result: state.result,
        savedRotaId: state.savedRotaId,
        reorderLocked: state.reorderLocked,
        orderDirty: state.orderDirty,
        autoRecalc: state.autoRecalc,
        historicoExecucao: state.historicoExecucao,
        progressUpdatedAt: state.progressUpdatedAt,
        tab: state.tab,
        selectedTempId: state.selectedTempId,
      }),
    },
  ),
)
