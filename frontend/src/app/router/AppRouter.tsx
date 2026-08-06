import { lazy, Suspense } from 'react'
import { Outlet, useRoutes } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { PageLoader } from '@/shared/components/ui'
import {
  AuthProvider,
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/auth/components/AuthGate'

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)

const DeliveriesPage = lazy(() =>
  import('@/features/deliveries/pages/DeliveriesPage').then((module) => ({
    default: module.DeliveriesPage,
  })),
)

const PendingPage = lazy(() =>
  import('@/features/pending/pages/PendingPage').then((module) => ({
    default: module.PendingPage,
  })),
)

const PrestacaoPage = lazy(() =>
  import('@/features/accounting/pages/PrestacaoPage').then((module) => ({
    default: module.PrestacaoPage,
  })),
)

const ReportsPage = lazy(() =>
  import('@/features/reports/pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
)

const PlannerPage = lazy(() =>
  import('@/features/routing/pages/PlannerPage').then((module) => ({
    default: module.PlannerPage,
  })),
)

const routes = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'entregas', element: <DeliveriesPage /> },
              { path: 'pendencias', element: <PendingPage /> },
              { path: 'prestacao', element: <PrestacaoPage /> },
              { path: 'relatorios', element: <ReportsPage /> },
              { path: 'planejador', element: <PlannerPage /> },
            ],
          },
        ],
      },
    ],
  },
]

function AppRoutes() {
  return useRoutes(routes)
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AppRoutes />
    </Suspense>
  )
}
