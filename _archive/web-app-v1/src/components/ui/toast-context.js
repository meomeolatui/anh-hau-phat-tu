import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/** toast({ title, description?, tone?: 'success'|'info'|'warning', duration? }) */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast phải dùng bên trong <ToastProvider>')
  return ctx.toast
}
