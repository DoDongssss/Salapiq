import { createContext, useContext } from "react"

export type ToastType = "success" | "error" | "info" | "warning"

export type Toast = {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

export type ToastInput = Omit<Toast, "id">

export type ToastContextValue = {
  toasts: Toast[]
  toast: (options: ToastInput) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext(null as ToastContextValue | null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}