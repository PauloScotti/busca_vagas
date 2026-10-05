import { createContext, use } from 'react'

export type ToastKind = 'success' | 'error'
export type Notify = (message: string, kind?: ToastKind) => void

export const ToastContext = createContext<Notify | null>(null)

export function useToast(): Notify {
  const notify = use(ToastContext)
  if (!notify) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return notify
}
