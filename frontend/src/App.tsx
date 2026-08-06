import { AppProviders } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { PwaInstallPrompt } from '@/features/pwa/components/PwaInstallPrompt'

function App() {
  return (
    <AppProviders>
      <AppRouter />
      <PwaInstallPrompt />
    </AppProviders>
  )
}

export default App
