import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LangProvider } from './i18n/LangContext'
import type { Lang } from './i18n/translations'

const initialLang: Lang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'fr'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider initialLang={initialLang}>
      <App />
    </LangProvider>
  </StrictMode>,
)
