import { createContext, useContext, useState } from 'react'

type Toast = { id: number; message: string; type?: 'success' | 'error' }
const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = (t: Omit<Toast, 'id'>) => {
    const id = Date.now()
    setToasts((arr) => [...arr, { id, ...t }])
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 3000)
  }
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded shadow text-white ${t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}
