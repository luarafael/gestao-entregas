export type DashboardScope = 'motoboy' | 'cliente' | 'geral'

export type DashboardOrigemCadastro = 'MOTOBOY' | 'CLIENTE'

export type DashboardReportOrigem = 'MOTOBOY' | 'CLIENTE' | 'GERAL'

export const DASHBOARD_SCOPE_OPTIONS: Array<{
  value: DashboardScope
  label: string
}> = [
  { value: 'motoboy', label: 'Motoboy' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'geral', label: 'Geral' },
]

export function dashboardScopeToOrigemCadastro(
  scope: DashboardScope,
): DashboardOrigemCadastro | undefined {
  if (scope === 'motoboy') return 'MOTOBOY'
  if (scope === 'cliente') return 'CLIENTE'
  return undefined
}

export function dashboardScopeToReportOrigem(
  scope: DashboardScope,
): DashboardReportOrigem {
  if (scope === 'motoboy') return 'MOTOBOY'
  if (scope === 'cliente') return 'CLIENTE'
  return 'GERAL'
}

export function getDashboardScopeDescription(
  scope: DashboardScope,
  isAdmin: boolean,
  motoboySelected: boolean,
): string {
  if (scope === 'cliente') {
    return 'Pedidos cadastrados na aba Cliente de Entregas.'
  }

  if (scope === 'geral') {
    return 'Visão combinada de entregas motoboy e pedidos de clientes.'
  }

  if (isAdmin) {
    return motoboySelected
      ? 'Visão individual do motoboy selecionado.'
      : 'Corridas registradas pelos motoboys.'
  }

  return 'Visão do seu dia e indicadores da semana.'
}

export function getReportScopeDescription(
  scope: DashboardScope,
  isAdmin: boolean,
  motoboySelected: boolean,
): string {
  if (scope === 'cliente') {
    return 'Indicadores e gráficos dos pedidos cadastrados na aba Cliente.'
  }

  if (scope === 'geral') {
    return 'Indicadores combinados de entregas motoboy e pedidos de clientes.'
  }

  if (isAdmin) {
    return motoboySelected
      ? 'Indicadores e gráficos do motoboy selecionado.'
      : 'Indicadores, gráficos e detalhamento das entregas dos motoboys no período.'
  }

  return 'Seus indicadores, gráficos e detalhamento das entregas no período.'
}

export function getReportScopeLabel(
  scope: DashboardScope,
  isAdmin: boolean,
  motoboySelected: boolean,
): string {
  if (scope === 'cliente') return 'Pedidos de clientes'
  if (scope === 'geral') return 'Geral (motoboy + clientes)'

  if (isAdmin) {
    return motoboySelected ? 'Motoboy selecionado' : 'Todos os motoboys'
  }

  return 'Suas entregas'
}
