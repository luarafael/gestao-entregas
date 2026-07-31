import { useRoutes } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { DashboardPage } from '@/features/dashboard'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import {
  IconClock,
  IconPackage,
  IconReceipt,
} from '@/shared/components/icons'

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'entregas',
        element: (
          <PlaceholderPage
            title="Entregas"
            description="CRUD completo de entregas será implementado na Etapa 4."
            icon={<IconPackage className="size-7" />}
          />
        ),
      },
      {
        path: 'pendencias',
        element: (
          <PlaceholderPage
            title="Pendências"
            description="Gestão de pendências será implementada na Etapa 5."
            icon={<IconClock className="size-7" />}
          />
        ),
      },
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
