import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { AdminNotificationsListener } from '@/features/notifications/components/AdminNotificationsListener'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Visão geral do dia',
  },
  '/meu-dia': {
    title: 'Meu dia',
    subtitle: 'Suas entregas e ganhos',
  },
  '/minha-prestacao': {
    title: 'Minha prestação',
    subtitle: 'Enviar para aprovação',
  },
  '/aprovacoes': {
    title: 'Aprovações',
    subtitle: 'Prestações dos motoboys',
  },
  '/monitoramento': {
    title: 'Monitoramento',
    subtitle: 'Entregas em tempo quase real',
  },
  '/motoboys': {
    title: 'Motoboys',
    subtitle: 'Funcionários da empresa',
  },
  '/entregas': {
    title: 'Entregas',
    subtitle: 'Cadastro e listagem',
  },
  '/pendencias': {
    title: 'Pendências',
    subtitle: 'Controle de valores pendentes',
  },
  '/prestacao': {
    title: 'Prestação de Contas',
    subtitle: 'Fechamento do dia',
  },
  '/relatorios': {
    title: 'Relatórios',
    subtitle: 'Indicadores e gráficos',
  },
  '/planejador': {
    title: 'Planejador de Rotas',
    subtitle: 'Otimize a sequência das entregas',
  },
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const page = pageTitles[pathname] ?? {
    title: 'Sistema de Entregas',
    subtitle: 'Gestão diária',
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNotificationsListener />
      <div className="hidden w-64 shrink-0 md:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={page.title}
          subtitle={page.subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
