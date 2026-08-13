import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { LangProvider } from './i18n/LangContext'
import type { Lang } from './i18n/translations'

const initialLang: Lang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'fr'

// PWA : enregistrement du service worker (mise à jour automatique)
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider initialLang={initialLang}>
      <App />
    </LangProvider>
  </StrictMode>,
)
