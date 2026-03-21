import { Pencil, Trash2, Plus, Pause, CheckCircle2, Calendar, Users } from "lucide-react"
import {
  getGoalPercent, getDaysLeft,
  type SavingsGoal,
} from "@/types/SavingsTypes"
import {
  GOAL_STATUS_COLORS, GOAL_PRIORITY_COLORS,
  GOAL_CATEGORIES,
} from "@/config/subscriber"
import { cn } from "@/lib/utils"

type Props = {
  goal:          SavingsGoal
  canManage:     boolean   
  onContribute:  (goal: SavingsGoal) => void
  onEdit:        (goal: SavingsGoal) => void
  onDelete:      (id: string) => void
  onTogglePause: (goal: SavingsGoal) => void
  deleting?:     boolean
}

export default function SavingsCard({
  goal, canManage,
  onContribute, onEdit, onDelete, onTogglePause, deleting,
}: Props) {
  const pct      = getGoalPercent(goal)
  const daysLeft = getDaysLeft(goal.target_date)
  const catIcon  = GOAL_CATEGORIES.find((c) => c.value === goal.category)?.icon ?? "🎯"
  const isAchieved = goal.status === "achieved"
  const isPaused   = goal.status === "paused"

  const circumference = 2 * Math.PI * 28
  const offset        = circumference - (pct / 100) * circumference

  return (
    <div className={cn(
      "bg-white rounded-2xl border p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all",
      isAchieved ? "border-sky-200 bg-sky-50/30" : "border-stone-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
    )}>

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0",
            isAchieved ? "bg-sky-100" : "bg-stone-100"
          )}>
            {isAchieved ? "🎉" : catIcon}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-stone-900 leading-tight">{goal.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", GOAL_STATUS_COLORS[goal.status])}>
                {goal.status}
              </span>
              <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", GOAL_PRIORITY_COLORS[goal.priority])}>
                {goal.priority}
              </span>
              {goal.family_id && (
                <span className="mono text-[9px] px-1.5 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-600 flex items-center gap-0.5">
                  <Users size={8} /> Family
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — only shown if canManage */}
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            {!isAchieved && (
              <button
                onClick={() => onTogglePause(goal)}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  isPaused
                    ? "text-emerald-500 hover:bg-emerald-50"
                    : "text-stone-300 hover:text-amber-500 hover:bg-amber-50"
                )}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <CheckCircle2 size={12} /> : <Pause size={12} />}
              </button>
            )}
            <button
              onClick={() => onEdit(goal)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              disabled={deleting}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Progress ring + amounts */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#f1f0eb" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke={isAchieved ? "#0ea5e9" : "#10b981"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 36 36)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono text-[12px] font-semibold text-stone-900">{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="mono text-[9px] text-stone-400 mb-0.5">Saved</p>
          <p className="text-[18px] font-semibold text-stone-900 tracking-tight leading-none">
            ₱{goal.current_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
          </p>
          <p className="mono text-[10px] text-stone-400 mt-1">
            of ₱{goal.target_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
          </p>
          <p className="mono text-[10px] text-emerald-600 mt-0.5">
            ₱{Math.max(goal.target_amount - goal.current_amount, 0).toLocaleString("en-PH", { minimumFractionDigits: 0 })} to go
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all duration-500", isAchieved ? "bg-sky-400" : "bg-emerald-500")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          {daysLeft !== null ? (
            <div className="flex items-center gap-1">
              <Calendar size={9} className="text-stone-400" />
              <p className={cn("mono text-[10px]", daysLeft < 0 ? "text-red-400" : daysLeft < 30 ? "text-amber-600" : "text-stone-400")}>
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)}d overdue`
                  : daysLeft === 0 ? "Due today"
                  : `${daysLeft}d left`
                }
              </p>
            </div>
          ) : (
            <p className="mono text-[10px] text-stone-300">No deadline</p>
          )}
        </div>

        {!isAchieved && !isPaused && (
          <button
            onClick={() => onContribute(goal)}
            className="flex items-center gap-1 h-7 px-3 mono text-[10px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Plus size={10} /> Add funds
          </button>
        )}

        {isAchieved && (
          <span className="mono text-[10px] text-sky-600 flex items-center gap-1">
            <CheckCircle2 size={11} /> Goal reached!
          </span>
        )}
      </div>
    </div>
  )
}