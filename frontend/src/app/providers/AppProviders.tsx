import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { queryClient } from '@/shared/lib/query-client'
import { useThemeStore } from '@/shared/stores/theme.store'
import { ToastContainer } from '@/shared/components/ui'

interface AppProvidersProps {
  children: ReactNode
}

function ThemeInitializer() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return null
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInitializer />
        {children}
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
