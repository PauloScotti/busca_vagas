import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Notify, type ToastKind } from './toast-context'

interface ToastState {
  id: number
  kind: ToastKind
  message: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const notify = useCallback<Notify>((message, kind = 'success') => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), kind, message })
    timer.current = setTimeout(() => setToast(null), 5000)
  }, [])

  return (
    <ToastContext value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`toast toast-${toast.kind}`}>
            <span>{toast.message}</span>
            <button type="button" className="toast-close" aria-label="Fechar" onClick={() => setToast(null)}>
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext>
  )
}
