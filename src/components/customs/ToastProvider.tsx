import { useState, useCallback, useRef } from "react"
import type { ReactNode } from "react"
import { ToastContext } from "@/hooks/useToast"
import type { Toast, ToastInput } from "@/hooks/useToast"

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState([] as Toast[])
  const timers = useRef(new Map() as Map<string, ReturnType<typeof setTimeout>>)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (options: ToastInput) => {
      const id = crypto.randomUUID()
      const duration = options.duration ?? 4000
      setToasts((prev) => [...prev, { ...options, id, duration }])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}