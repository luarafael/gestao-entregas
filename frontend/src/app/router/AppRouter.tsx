import { useRoutes } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { DashboardPage } from '@/features/dashboard'
import { DeliveriesPage } from '@/features/deliveries'
import { PendingPage } from '@/features/pending'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { IconReceipt } from '@/shared/components/icons'

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'entregas', element: <DeliveriesPage /> },
      { path: 'pendencias', element: <PendingPage /> },
      {
        path: 'prestacao',
        element: (
          <PlaceholderPage
            title="Prestação de Contas"
            description="Fechamento do dia e texto para WhatsApp na Etapa 6."
            icon={<IconReceipt className="size-7" />}
          />
        ),
      },
    ],
  },
]

export function AppRouter() {
  return useRoutes(routes)
}
