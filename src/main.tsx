import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { UpdatePrompt } from '@/app/layout/UpdatePrompt'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('No se encontró el elemento #root en el documento.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
      {/* Fuera del router: registra el service worker haya sesión o no. Dentro
          del cascarón sólo se registraría después de entrar, que es tarde. */}
      <UpdatePrompt />
    </AppProviders>
  </StrictMode>,
)
