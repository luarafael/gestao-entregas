import { useThemeStore } from '@/shared/stores/theme.store'

const chartThemes = {
  dark: {
    primary: '#818cf8',
    success: '#4ade80',
    warning: '#fbbf24',
    grid: '#3f3f46',
    text: '#a1a1aa',
    tooltipBg: '#18181b',
    tooltipBorder: '#27272a',
  },
  light: {
    primary: '#6366f1',
    success: '#16a34a',
    warning: '#d97706',
    grid: '#e2e8f0',
    text: '#64748b',
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1',
  },
} as const

export function useChartTheme() {
  const theme = useThemeStore((state) => state.theme)
  return chartThemes[theme]
}
