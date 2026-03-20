import { cn } from "@/lib/utils"

type SummaryCardProps = {
  label:      string
  value:      number
  currency?:  string
  accentColor?: string
  valueClass?: string
}

export default function SummaryCard({
  label,
  value,
  currency = "₱",
  accentColor = "border-t-stone-300",
  valueClass = "text-stone-900",
}: SummaryCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-stone-200 border-t-2 p-4",
      "shadow-[0_2px_16px_rgba(0,0,0,0.04)]",
      accentColor
    )}>
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-stone-400 mb-2">
        {label}
      </p>
      <p className={cn("text-[22px] font-semibold tracking-tight", valueClass)}>
        {currency}{Math.abs(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}