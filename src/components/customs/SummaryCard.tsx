import { cn, formatCurrency } from "@/lib/utils"

type SummaryCardProps = {
  label:      string
  value:      number
  currency?:  string
  color:      "emerald" | "red" | "sky"
  sub?:       string | null
  Icon?:      React.ComponentType<SVGProps<SVGSVGElement>>
}

export default function SummaryCard({
    label,
    value,
    currency = "₱",
    color,
    Icon,
    sub
}: SummaryCardProps) {
    const colors = {
        emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-t-emerald-400" },
        red:     { text: "text-red-500",     bg: "bg-red-50",     border: "border-t-red-400"     },
        sky:     { text: "text-sky-600",     bg: "bg-sky-50",     border: "border-t-sky-400"     },
    }
    const c = colors[color]
    return (
        <div className={cn("bg-white rounded-2xl border-t-2 border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-3 sm:p-4", c.border)}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", c.bg)}>
                    {Icon && <Icon size={12} className={c.text} />}
                </div>
                <p className="mono text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-[0.1em]">{label}</p>
            </div>
            <p className={cn("text-[14px] sm:text-[17px] font-semibold tracking-tight", c.text)}>
                {formatCurrency(value, currency)}
            </p>
            <p className="mono text-[9px] text-stone-400 mt-0.5 truncate">{sub ?? "this month"}</p>
        </div>
    )
}