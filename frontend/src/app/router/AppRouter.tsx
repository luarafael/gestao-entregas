import { useRoutes } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { DashboardPage } from '@/features/dashboard'
import { DeliveriesPage } from '@/features/deliveries'
import { PendingPage } from '@/features/pending'
import { PrestacaoPage } from '@/features/accounting'
import { ReportsPage } from '@/features/reports'

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'entregas', element: <DeliveriesPage /> },
      { path: 'pendencias', element: <PendingPage /> },
      { path: 'prestacao', element: <PrestacaoPage /> },
      { path: 'relatorios', element: <ReportsPage /> },
    ],
  },
]

export function AppRouter() {
  return useRoutes(routes)
}
