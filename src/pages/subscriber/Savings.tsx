import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useSavingsStore } from "@/stores/useSavingsStore"
import { useFamilyStore }  from "@/stores/useFamilyStore"
import { deleteGoal, updateGoal } from "@/services/savingsService"
import { type SavingsGoal } from "@/types/SavingsTypes"
import {
  GOAL_STATUS_FILTER, type GoalStatusFilter,
} from "@/config/subscriber"
import SavingsCard      from "@/components/customs/SavingsCard"
import GoalDetailModal  from "@/components/modals/GoalDetailModal"
import GoalModal      from "@/components/modals/GoalModal"
import ContributeModal from "@/components/modals/ContributeModal"
import { Plus, PiggyBank } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Savings() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const goals    = useSavingsStore((s) => s.goals)
  const loading  = useSavingsStore((s) => s.loading)
  const refresh  = useSavingsStore((s) => s.refresh)
  const overview = useSavingsStore((s) => s.overview)
  const family      = useFamilyStore((s) => s.family)
  const myRole      = family?.members.find((m) => m.user_id === user?.id)?.role
  const isFamilyAdmin = myRole === "admin"

  const [statusFilter,    setStatusFilter]    = useState<GoalStatusFilter>("all")
  const [showGoalModal,   setShowGoalModal]   = useState(false)
  const [editGoal,        setEditGoal]        = useState<SavingsGoal | null>(null)
  const [contributeGoal,  setContributeGoal]  = useState<SavingsGoal | null>(null)
  const [deleting,        setDeleting]        = useState<string | null>(null)
  const [detailGoal,      setDetailGoal]      = useState<SavingsGoal | null>(null)

  useEffect(() => {
    if (!user) return
    // Always refresh on mount so family goals load correctly
    // regardless of store initialized state
    refresh(user.id, family?.id)
  }, [user, family?.id])

  const ov = overview()

  const filtered = statusFilter === "all"
    ? goals
    : goals.filter((g) => g.status === statusFilter)

  const openCreate = () => { setEditGoal(null); setShowGoalModal(true) }
  const openEdit   = (goal: SavingsGoal) => { setEditGoal(goal); setShowGoalModal(true) }

  const handleDelete = async (id: string) => {
    if (!user) return
    setDeleting(id)
    const error = await deleteGoal(id)
    setDeleting(null)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Goal removed" })
      await refresh(user.id)
    }
  }

  const handleTogglePause = async (goal: SavingsGoal) => {
    if (!user) return
    const newStatus = goal.status === "paused" ? "active" : "paused"
    const error = await updateGoal(goal.id, { status: newStatus })
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "info", title: newStatus === "paused" ? "Goal paused" : "Goal resumed" })
      await refresh(user.id)
    }
  }

  return (
    <div className="page-reveal">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Savings</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">
            {ov.activeGoals} active · {ov.achievedGoals} achieved
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
          <Plus size={13} /> New goal
        </Button>
      </div>

      {/* Overview card */}
      {!loading && goals.length > 0 && (
        <div className="bg-[#0f1a12] rounded-2xl p-5 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="mono text-[10px] tracking-[0.15em] uppercase text-emerald-900 mb-1">Total saved</p>
              <p className="text-3xl font-semibold text-white tracking-tight">
                ₱{ov.totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
              <p className="mono text-[10px] text-emerald-900 mt-1">
                of ₱{ov.totalTarget.toLocaleString("en-PH", { minimumFractionDigits: 2 })} target
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <span className="mono text-[10px] text-emerald-900">{ov.activeGoals} active</span>
                <span className="mono text-[10px] text-emerald-900">·</span>
                <span className="mono text-[10px] text-sky-400">{ov.achievedGoals} achieved</span>
              </div>
              <p className="text-xl font-semibold text-white">{ov.totalPercent}%</p>
              <p className="mono text-[10px] text-emerald-900">overall</p>
            </div>
          </div>

          {/* Overall progress */}
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(ov.totalPercent, 100)}%` }}
            />
          </div>

          {/* Per-goal mini bars */}
          {goals.filter(g => g.status === "active").length > 1 && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
              {goals.filter(g => g.status === "active").map((g) => {
                const pct = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100)
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="mono text-[9px] text-white/50 truncate">{g.title}</p>
                      <p className="mono text-[9px] text-white/50">{pct}%</p>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      {!loading && goals.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4">
          {GOAL_STATUS_FILTER.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "mono text-[11px] px-3 py-1.5 rounded-lg transition-colors",
                statusFilter === value
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Goal cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <PiggyBank size={24} className="text-stone-300" />
          </div>
          <p className="text-[14px] font-semibold text-stone-700">No savings goals yet</p>
          <p className="mono text-[11px] text-stone-400 mt-1.5 mb-5">
            Create a goal and start saving towards something meaningful
          </p>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
            <Plus size={13} className="mr-1" /> Create your first goal
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-[13px] font-medium text-stone-600">No {statusFilter} goals</p>
          <p className="mono text-[11px] text-stone-400 mt-1">
            Switch to a different filter or create a new goal
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((goal) => (
            <div key={goal.id} onClick={() => setDetailGoal(goal)} className="cursor-pointer">
              <SavingsCard
                goal={goal}
                canManage={!goal.family_id || isFamilyAdmin}
                onContribute={setContributeGoal}
                onEdit={(g) => { setDetailGoal(null); openEdit(g) }}
                onDelete={handleDelete}
                onTogglePause={handleTogglePause}
                deleting={deleting === goal.id}
              />
            </div>
          ))}
        </div>
      )}

      {showGoalModal && (
        <GoalModal
          goal={editGoal}
          onClose={() => { setShowGoalModal(false); setEditGoal(null) }}
        />
      )}

      {detailGoal && !contributeGoal && (
        <GoalDetailModal
          goal={detailGoal}
          onClose={() => setDetailGoal(null)}
          onEdit={(g) => { setDetailGoal(null); openEdit(g) }}
          onContribute={setContributeGoal}
        />
      )}

      {contributeGoal && (
        <ContributeModal
          goal={contributeGoal}
          onClose={() => {
            setContributeGoal(null)
            setDetailGoal(null)
          }}
          onSuccess={() => refresh(user!.id, family?.id)}
        />
      )}
    </div>
  )
}