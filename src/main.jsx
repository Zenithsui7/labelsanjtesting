import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ─── window.storage polyfill ────────────────────────────────────────────────
// The app was built using window.storage (a Claude artifact API).
// This polyfill maps it to localStorage so it works in any browser.
// "shared" flag is ignored — all data is local to the user's browser.
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(key)
      if (value === null) throw new Error(`Key not found: ${key}`)
      return { key, value, shared: false }
    },
    set: async (key, value, shared = false) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      return { key, value, shared }
    },
    delete: async (key) => {
      localStorage.removeItem(key)
      return { key, deleted: true }
    },
    list: async (prefix = '', shared = false) => {
      const keys = Object.keys(localStorage).filter(k =>
        prefix ? k.startsWith(prefix) : true
      )
      return { keys, prefix, shared }
    },
  }
}
// ────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
