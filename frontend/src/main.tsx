import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import './styles.css'

// Optional Sentry init via VITE_SENTRY_DSN
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN as string })
    })
    .catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
