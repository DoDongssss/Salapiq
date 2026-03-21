import { Pencil, Trash2 } from "lucide-react"
import { getBudgetStatus, type BudgetSummary } from "@/types/BudgetTypes"
import { cn } from "@/lib/utils"
import {
  STATUS_COLORS, STATUS_TEXT, STATUS_LABELS,
} from "@/config/subscriber"

type Props = {
  budget:    BudgetSummary
  onEdit:    (budget: BudgetSummary) => void
  onDelete:  (id: string) => void
  deleting?: boolean
}

export default function BudgetCard({ budget: b, onEdit, onDelete, deleting }: Props) {
  const status = getBudgetStatus(Number(b.percent_used))
  const pct    = Math.min(Number(b.percent_used), 100)
  const isOver = status === "over"

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow flex flex-col gap-3">

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-stone-900">{b.category}</p>
          <span className={cn(
            "mono text-[9px] px-2 py-0.5 rounded-full border w-fit",
            STATUS_TEXT[status]
          )}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(b)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(b.id)}
            disabled={deleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="mono text-[9px] text-stone-400 mb-0.5">Spent</p>
          <p className={cn(
            "text-[22px] font-semibold tracking-tight leading-none",
            isOver ? "text-red-500" : status === "warning" ? "text-amber-600" : "text-stone-900"
          )}>
            ₱{Number(b.spent).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right">
          <p className="mono text-[9px] text-stone-400 mb-0.5">of ₱{b.budget_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}</p>
          <p className={cn(
            "mono text-[13px] font-semibold",
            isOver ? "text-red-400" : "text-stone-400"
          )}>
            {pct}%
          </p>
        </div>
      </div>

      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", STATUS_COLORS[status])}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={cn(
        "mono text-[10px]",
        isOver ? "text-red-400" : "text-stone-400"
      )}>
        {isOver
          ? `₱${Math.abs(Number(b.remaining)).toLocaleString("en-PH", { minimumFractionDigits: 2 })} over budget`
          : `₱${Number(b.remaining).toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining`
        }
      </p>
    </div>
  )
}