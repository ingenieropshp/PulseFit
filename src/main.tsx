// main.tsx: punto de entrada de la aplicación. Monta <App /> dentro del
// elemento #root definido en index.html, envuelto en StrictMode para
// detectar problemas comunes de React durante el desarrollo.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
