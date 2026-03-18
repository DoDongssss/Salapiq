import { useToast } from "@/hooks/useToast"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react"

type ToastType = "success" | "error" | "info" | "warning"

const config: Record<ToastType, {
  icon: typeof CheckCircle2
  bar: string
  icon_class: string
  bg: string
  border: string
  title: string
}> = {
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    icon_class: "text-emerald-500",
    bg: "bg-white",
    border: "border-emerald-200",
    title: "text-stone-900",
  },
  error: {
    icon: XCircle,
    bar: "bg-red-500",
    icon_class: "text-red-500",
    bg: "bg-white",
    border: "border-red-200",
    title: "text-stone-900",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-400",
    icon_class: "text-amber-500",
    bg: "bg-white",
    border: "border-amber-200",
    title: "text-stone-900",
  },
  info: {
    icon: Info,
    bar: "bg-sky-500",
    icon_class: "text-sky-500",
    bg: "bg-white",
    border: "border-sky-200",
    title: "text-stone-900",
  },
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0)   scale(1);    }
          to   { opacity: 0; transform: translateY(8px)  scale(0.96); }
        }
        .toast-enter {
          animation: toastIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .toast-progress {
          animation: toastProgress linear forwards;
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>

      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-[340px]"
      >
        {toasts.map((t) => {
          const { icon: Icon, bar, icon_class, bg, border, title } = config[t.type]

          return (
            <div
              key={t.id}
              className={cn(
                "toast-enter relative overflow-hidden rounded-xl border shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
                "flex items-start gap-3 px-4 py-3.5",
                bg, border
              )}
            >
              {/* Left accent bar */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl", bar)} />

              {/* Icon */}
              <Icon size={16} className={cn("shrink-0 mt-0.5", icon_class)} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-medium leading-tight", title)}>
                  {t.title}
                </p>
                {t.description && (
                  <p className="mono text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-stone-300 hover:text-stone-500 transition-colors mt-0.5"
              >
                <X size={14} />
              </button>

              {/* Progress bar */}
              <div
                className={cn("absolute bottom-0 left-0 h-[2px] rounded-full opacity-40", bar)}
                style={{ animationDuration: `${t.duration ?? 4000}ms` }}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}