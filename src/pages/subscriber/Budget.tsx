import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { budgetSchema, type BudgetForm, type BudgetSummary, getBudgetStatus } from "@/types/BudgetTypes"
import { MONTH_LABELS, STATUS_COLORS, STATUS_LABELS, STATUS_TEXT } from "@/config/subscriber"
import {
  getBudgetSummary, createBudget,
  updateBudget, deleteBudget, getBudgetOverview,
} from "@/services/BudgetService"
import { TRANSACTION_CATEGORIES } from "@/types/AccountTypes"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Target } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Budget() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const now = new Date()

  const [month,       setMonth]       = useState(now.getMonth() + 1)
  const [year,        setYear]        = useState(now.getFullYear())
  const [budgets,     setBudgets]     = useState<BudgetSummary[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editBudget,  setEditBudget]  = useState<BudgetSummary | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      amount:   0,
      month,
      year,
    },
  })

    useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
        setLoading(true)
        const data = await getBudgetSummary(user.id, month, year)
        if (cancelled) return
        setBudgets(data)
        setLoading(false)
    }

    run()
    return () => { cancelled = true }
    }, [user, month, year])

    const reload = async () => {
  if (!user) return
  const data = await getBudgetSummary(user.id, month, year)
  setBudgets(data)
}

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const openCreate = () => {
    setEditBudget(null)
    form.reset({ category: "", amount: 0, month, year })
    setShowModal(true)
  }

  const openEdit = (budget: BudgetSummary) => {
    setEditBudget(budget)
    form.reset({
      category: budget.category,
      amount:   budget.budget_amount,
      month:    budget.month,
      year:     budget.year,
    })
    setShowModal(true)
  }

  const onSubmit = async (data: BudgetForm) => {
    if (!user) return

    if (editBudget) {
      const error = await updateBudget(editBudget.id, data)
      if (error) {
        toast({ type: "error", title: "Update failed", description: error })
      } else {
        toast({ type: "success", title: "Budget updated" })
        setShowModal(false)
        reload()
      }
    } else {
      const { error } = await createBudget(user.id, data)
      if (error) {
        toast({ type: "error", title: "Failed to create", description: error })
      } else {
        toast({ type: "success", title: "Budget created" })
        setShowModal(false)
        reload()
      }
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const error = await deleteBudget(id)
    setDeleting(null)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Budget removed" })
      reload()
    }
  }

  const overview        = getBudgetOverview(budgets)
  const usedCategories  = budgets.map((b) => b.category)
  const availableCategories = TRANSACTION_CATEGORIES.filter(
    (c) => editBudget ? true : !usedCategories.includes(c)
  )

  return (
    <div className="page-reveal">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Budget</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">Set spending limits by category</p>
        </div>
        <Button
          onClick={openCreate}
          disabled={availableCategories.length === 0}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4"
        >
          <Plus size={13} /> Add budget
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 px-5 py-4 mb-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-stone-900">{MONTH_LABELS[month - 1]}</p>
          <p className="mono text-[11px] text-stone-400">{year}</p>
        </div>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overview card */}
      {!loading && budgets.length > 0 && (
        <div className="bg-[#0f1a12] rounded-2xl p-5 mb-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="mono text-[10px] tracking-[0.15em] uppercase text-emerald-900 mb-1">Total budget</p>
              <p className="text-3xl font-semibold text-white tracking-tight">
                ₱{overview.totalBudgeted.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="mono text-[10px] text-emerald-900">Spent</p>
              <p className="mono text-[16px] font-semibold text-white">
                ₱{overview.totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {/* Overall progress bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                overview.overallPercent >= 100 ? "bg-red-400" :
                overview.overallPercent >= 80  ? "bg-amber-400" : "bg-emerald-400"
              )}
              style={{ width: `${Math.min(overview.overallPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="mono text-[10px] text-emerald-900">
              ₱{overview.totalRemaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining
            </p>
            <p className="mono text-[10px] text-emerald-900">{overview.overallPercent}% used</p>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center">
          <Target size={32} className="text-stone-200 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-stone-600">No budgets for this month</p>
          <p className="mono text-[11px] text-stone-400 mt-1 mb-4">
            Set spending limits per category to stay on track
          </p>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
            <Plus size={13} className="mr-1" /> Add your first budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {budgets.map((b) => {
            const status  = getBudgetStatus(Number(b.percent_used))
            const pct     = Math.min(Number(b.percent_used), 100)
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow">

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-stone-900">{b.category}</p>
                    <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", STATUS_TEXT[status])}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(b)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deleting === b.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn("h-full rounded-full transition-all", STATUS_COLORS[status])}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Amounts */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="mono text-[10px] text-stone-400">Spent</p>
                    <p className={cn(
                      "mono text-[15px] font-semibold",
                      status === "over" ? "text-red-500" :
                      status === "warning" ? "text-amber-600" : "text-stone-900"
                    )}>
                      ₱{Number(b.spent).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mono text-[10px] text-stone-400">Limit</p>
                    <p className="mono text-[15px] font-semibold text-stone-400">
                      ₱{b.budget_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-50 flex items-center justify-between">
                  <p className="mono text-[10px] text-stone-400">
                    {status === "over"
                      ? `₱${Math.abs(Number(b.remaining)).toLocaleString("en-PH", { minimumFractionDigits: 2 })} over`
                      : `₱${Number(b.remaining).toLocaleString("en-PH", { minimumFractionDigits: 2 })} left`
                    }
                  </p>
                  <p className="mono text-[10px] text-stone-400">{b.percent_used}%</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
              <h2 className="text-[15px] font-semibold text-stone-900">
                {editBudget ? "Edit budget" : "Add budget"}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Category</Label>
                <div className="relative">
                  <select
                    className={cn(
                      "w-full h-10 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800",
                      "focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                      "appearance-none cursor-pointer",
                      form.formState.errors.category && "border-red-300"
                    )}
                    {...form.register("category")}
                  >
                    <option value="">Select category</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
                {form.formState.errors.category && <p className="mono text-[10px] text-red-400">— {form.formState.errors.category.message}</p>}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Budget limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">₱</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={cn("h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", form.formState.errors.amount && "border-red-300")}
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.amount && <p className="mono text-[10px] text-red-400">— {form.formState.errors.amount.message}</p>}
              </div>

              {/* Month / Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Month</Label>
                  <div className="relative">
                    <select
                      className="w-full h-10 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                      {...form.register("month", { valueAsNumber: true })}
                    >
                      {MONTH_LABELS.map((label, i) => (
                        <option key={i + 1} value={i + 1}>{label}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Year</Label>
                  <Input
                    type="number"
                    placeholder="2026"
                    className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                    {...form.register("year", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="text-[12px] h-9 border-stone-200 text-stone-600">
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                  {form.formState.isSubmitting
                    ? <SpinnerBtn label={editBudget ? "Saving" : "Creating"} />
                    : editBudget ? "Save changes" : "Create budget"
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}