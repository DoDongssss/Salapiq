import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useSavingsStore } from "@/stores/useSavingsStore"
import { useFamilyStore }  from "@/stores/useFamilyStore"
import {
  type SavingsGoal, getGoalPercent, getDaysLeft,
} from "@/types/SavingsTypes"
import {
  GOAL_CATEGORIES, GOAL_STATUS_COLORS, GOAL_PRIORITY_COLORS,
} from "@/config/subscriber"
import {
  X, PiggyBank, Calendar, TrendingUp,
  Clock, Pencil, Plus, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  goal:         SavingsGoal
  onClose:      () => void
  onEdit:       (goal: SavingsGoal) => void
  onContribute: (goal: SavingsGoal) => void
}

export default function GoalDetailModal({ goal, onClose, onEdit, onContribute }: Props) {
  const { user } = useAuth()

  const goals               = useSavingsStore((s) => s.goals)
  const contributions       = useSavingsStore((s) => s.contributions)
  const contribLoading      = useSavingsStore((s) => s.contributionsLoading)
  const fetchContributions  = useSavingsStore((s) => s.fetchContributions)
  const family              = useFamilyStore((s) => s.family)

  const myRole        = family?.members.find((m) => m.user_id === user?.id)?.role
  const isFamilyAdmin = myRole === "admin"

  const liveGoal = goals.find((g) => g.id === goal.id) ?? goal
  const goalContributions = contributions[liveGoal.id] ?? []
  const isLoadingContribs = contribLoading[liveGoal.id] ?? false

  useEffect(() => {
    fetchContributions(liveGoal.id)
  }, [liveGoal.id])

  const pct        = getGoalPercent(liveGoal)
  const daysLeft   = getDaysLeft(liveGoal.target_date)
  const catIcon    = GOAL_CATEGORIES.find((c) => c.value === liveGoal.category)?.icon ?? "🎯"
  const catLabel   = GOAL_CATEGORIES.find((c) => c.value === liveGoal.category)?.label ?? liveGoal.category
  const isAchieved = liveGoal.status === "achieved"
  const isPaused   = liveGoal.status === "paused"
  const canManage  = !liveGoal.family_id || isFamilyAdmin

  const circumference = 2 * Math.PI * 40
  const offset        = circumference - (pct / 100) * circumference

  const totalContributed = goalContributions.reduce((s, c) => s + c.amount, 0)
  const avgContribution  = goalContributions.length > 0
    ? totalContributed / goalContributions.length
    : 0

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:translateY(10px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
        `}</style>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
              isAchieved ? "bg-sky-100" : "bg-stone-100"
            )}>
              {isAchieved ? "🎉" : catIcon}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-stone-900">{liveGoal.title}</h2>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", GOAL_STATUS_COLORS[liveGoal.status])}>
                  {liveGoal.status}
                </span>
                <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", GOAL_PRIORITY_COLORS[liveGoal.priority])}>
                  {liveGoal.priority} priority
                </span>
                <span className="mono text-[9px] text-stone-400">{catLabel}</span>
                {liveGoal.family_id && (
                  <span className="mono text-[9px] px-1.5 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-600 flex items-center gap-0.5">
                    <Users size={8} /> Family goal
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isAchieved && !isPaused && (
              <Button
                onClick={() => onContribute(liveGoal)}
                className="h-8 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus size={11} className="mr-1" /> Add funds
              </Button>
            )}
            {canManage && (
              <button
                onClick={() => { onClose(); onEdit(liveGoal) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
              >
                <Pencil size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">

          <div className="px-6 py-5 border-b border-stone-50">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f0eb" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={isAchieved ? "#0ea5e9" : "#10b981"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="mono text-[16px] font-semibold text-stone-900">{pct}%</span>
                  <span className="mono text-[9px] text-stone-400">saved</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="mono text-[9px] text-stone-400 mb-1">Saved</p>
                  <p className="text-[16px] font-semibold text-stone-900 leading-none">
                    ₱{liveGoal.current_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="mono text-[9px] text-stone-400 mb-1">Target</p>
                  <p className="text-[16px] font-semibold text-stone-900 leading-none">
                    ₱{liveGoal.target_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="mono text-[9px] text-stone-400 mb-1">Remaining</p>
                  <p className={cn("text-[16px] font-semibold leading-none", isAchieved ? "text-sky-500" : "text-emerald-600")}>
                    {isAchieved
                      ? "Achieved!"
                      : `₱${Math.max(liveGoal.target_amount - liveGoal.current_amount, 0).toLocaleString("en-PH", { minimumFractionDigits: 0 })}`
                    }
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="mono text-[9px] text-stone-400 mb-1">Deadline</p>
                  {daysLeft !== null ? (
                    <p className={cn("text-[13px] font-semibold leading-none mono", daysLeft < 0 ? "text-red-500" : daysLeft < 30 ? "text-amber-600" : "text-stone-900")}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                    </p>
                  ) : (
                    <p className="mono text-[13px] text-stone-400 leading-none">No deadline</p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-2 bg-stone-100 rounded-full overflow-hidden mt-4">
              <div
                className={cn("h-full rounded-full transition-all duration-700", isAchieved ? "bg-sky-400" : "bg-emerald-500")}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center gap-4 mt-3">
              {liveGoal.target_date && (
                <div className="flex items-center gap-1">
                  <Calendar size={10} className="text-stone-400" />
                  <p className="mono text-[10px] text-stone-400">
                    Target: {new Date(liveGoal.target_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
              {liveGoal.achieved_at && (
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-sky-400" />
                  <p className="mono text-[10px] text-sky-500">
                    Achieved: {new Date(liveGoal.achieved_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-stone-400" />
                <p className="mono text-[10px] text-stone-400">
                  Created: {new Date(liveGoal.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {goalContributions.length > 0 && (
            <div className="px-6 py-4 border-b border-stone-50">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="mono text-[9px] text-stone-400 mb-1">Contributions</p>
                  <p className="text-[18px] font-semibold text-stone-900">{goalContributions.length}</p>
                </div>
                <div className="text-center">
                  <p className="mono text-[9px] text-stone-400 mb-1">Total added</p>
                  <p className="mono text-[13px] font-semibold text-stone-900">
                    ₱{totalContributed.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="mono text-[9px] text-stone-400 mb-1">Average</p>
                  <p className="mono text-[13px] font-semibold text-stone-900">
                    ₱{Math.round(avgContribution).toLocaleString("en-PH")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-stone-900">Contribution history</p>
              {goalContributions.length > 0 && (
                <p className="mono text-[10px] text-stone-400">Last {goalContributions.length}</p>
              )}
            </div>

            {isLoadingContribs ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-stone-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : goalContributions.length === 0 ? (
              <div className="bg-stone-50 rounded-xl p-8 text-center">
                <PiggyBank size={24} className="text-stone-200 mx-auto mb-2" />
                <p className="mono text-[11px] text-stone-400">No contributions yet</p>
                {!isAchieved && !isPaused && (
                  <button
                    onClick={() => onContribute(liveGoal)}
                    className="mt-3 flex items-center gap-1 mx-auto mono text-[11px] text-emerald-600 hover:underline"
                  >
                    <Plus size={11} /> Add your first contribution
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-0 bg-white rounded-xl border border-stone-100 overflow-hidden">
                {goalContributions.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      i < goalContributions.length - 1 && "border-b border-stone-50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <TrendingUp size={13} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-stone-800">
                        {c.note || "Contribution"}
                      </p>
                      <p className="mono text-[10px] text-stone-400 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString("en-PH", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}
                        {" · "}
                        {new Date(c.created_at).toLocaleTimeString("en-PH", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="mono text-[13px] font-semibold text-emerald-600 shrink-0">
                      +₱{c.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}