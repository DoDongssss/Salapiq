import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import {
  getRecurring, createRecurring, updateRecurring,
  toggleRecurring, deleteRecurring,
} from "@/services/RecurringService"
import {
  recurringSchema, type RecurringForm,
  type RecurringTransaction, DAY_OPTIONS,
} from "@/types/RecurringTypes"
import { TRANSACTION_CATEGORIES } from "@/types/AccountTypes"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import {
  Plus, Pencil, Trash2, X, RefreshCw,
  TrendingUp, TrendingDown, Calendar,
  Building2, CreditCard, Smartphone, Wallet,
  type LucideIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

function ordinal(n: number) {
  const s = ["th","st","nd","rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function Recurring() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const accounts = useAccountStore((s) => s.accounts)

  const [entries,    setEntries]    = useState<RecurringTransaction[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editEntry,  setEditEntry]  = useState<RecurringTransaction | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [toggling,   setToggling]   = useState<string | null>(null)

  const form = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      account_id:   accounts[0]?.id ?? "",
      type:         "expense",
      amount:       0,
      category:     "",
      note:         "",
      day_of_month: 1,
      is_active:    true,
    },
  })

  const watchType = form.watch("type")

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const data = await getRecurring(user.id)
      if (cancelled) return
      setEntries(data)
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [user])

  const reload = async () => {
    if (!user) return
    const data = await getRecurring(user.id)
    setEntries(data)
  }

  const openCreate = () => {
    setEditEntry(null)
    form.reset({
      account_id:   accounts[0]?.id ?? "",
      type:         "expense",
      amount:       0,
      category:     "",
      note:         "",
      day_of_month: 1,
      is_active:    true,
    })
    setShowModal(true)
  }

  const openEdit = (entry: RecurringTransaction) => {
    setEditEntry(entry)
    form.reset({
      account_id:   entry.account_id,
      type:         entry.type,
      amount:       entry.amount,
      category:     entry.category ?? "",
      note:         entry.note     ?? "",
      day_of_month: entry.day_of_month,
      is_active:    entry.is_active,
    })
    setShowModal(true)
  }

  const onSubmit = async (data: RecurringForm) => {
    if (!user) return
    if (editEntry) {
      const error = await updateRecurring(editEntry.id, data)
      if (error) {
        toast({ type: "error", title: "Update failed", description: error })
      } else {
        toast({ type: "success", title: "Updated" })
        setShowModal(false)
        reload()
      }
    } else {
      const { error } = await createRecurring(user.id, data)
      if (error) {
        toast({ type: "error", title: "Failed to create", description: error })
      } else {
        toast({ type: "success", title: "Recurring entry created" })
        setShowModal(false)
        reload()
      }
    }
  }

  const handleToggle = async (entry: RecurringTransaction) => {
    setToggling(entry.id)
    const error = await toggleRecurring(entry.id, !entry.is_active)
    setToggling(null)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "info", title: entry.is_active ? "Paused" : "Resumed" })
      reload()
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const error = await deleteRecurring(id)
    setDeleting(null)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Removed" })
      reload()
    }
  }

  const income  = entries.filter((e) => e.type === "income")
  const expense = entries.filter((e) => e.type === "expense")

  return (
    <div className="page-reveal">

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Recurring</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">
            Automated income and expense entries
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
          <Plus size={13} /> Add recurring
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6">
        <RefreshCw size={14} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-medium text-emerald-800">Runs automatically every day at midnight</p>
          <p className="mono text-[10px] text-emerald-600 mt-0.5">
            Each entry fires once per month on the configured day. Max day is 28 to ensure all months are covered.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center">
          <RefreshCw size={32} className="text-stone-200 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-stone-600">No recurring entries yet</p>
          <p className="mono text-[11px] text-stone-400 mt-1 mb-5">
            Set up your salary, rent, subscriptions and more
          </p>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
            <Plus size={13} className="mr-1" /> Add your first entry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {income.length > 0 && (
            <EntryGroup
              label="Income"
              icon={TrendingUp}
              color="text-emerald-600"
              entries={income}
              toggling={toggling}
              deleting={deleting}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
          {expense.length > 0 && (
            <EntryGroup
              label="Expenses"
              icon={TrendingDown}
              color="text-red-500"
              entries={expense}
              toggling={toggling}
              deleting={deleting}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
              <h2 className="text-[15px] font-semibold text-stone-900">
                {editEntry ? "Edit recurring" : "Add recurring entry"}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

              {/* Type toggle */}
              <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
                {(["income", "expense"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue("type", t)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all capitalize",
                      watchType === t
                        ? t === "income"
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "bg-white text-red-500 shadow-sm"
                        : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    {t === "income" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {t}
                  </button>
                ))}
              </div>

              {/* Account */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Account</Label>
                <div className="relative">
                  <select
                    className="w-full h-10 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    {...form.register("account_id")}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
                {form.formState.errors.account_id && <Err msg={form.formState.errors.account_id.message!} />}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Amount</Label>
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
                {form.formState.errors.amount && <Err msg={form.formState.errors.amount.message!} />}
              </div>

              {/* Day of month */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                  Day of month <span className="text-stone-300 normal-case">(runs on this day every month)</span>
                </Label>
                <div className="relative">
                  <select
                    className="w-full h-10 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    {...form.register("day_of_month", { valueAsNumber: true })}
                  >
                    {DAY_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
                {form.formState.errors.day_of_month && <Err msg={form.formState.errors.day_of_month.message!} />}
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                  Category <span className="text-stone-300 normal-case">(optional)</span>
                </Label>
                <div className="relative">
                  <select
                    className="w-full h-10 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    {...form.register("category")}
                  >
                    <option value="">No category</option>
                    {TRANSACTION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                  Note <span className="text-stone-300 normal-case">(e.g. Salary, Netflix)</span>
                </Label>
                <Input
                  placeholder="e.g. Monthly salary"
                  className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                  {...form.register("note")}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="text-[12px] h-9 border-stone-200 text-stone-600">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className={cn(
                    "text-white text-[12px] h-9 px-5",
                    watchType === "income"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-500 hover:bg-red-600"
                  )}
                >
                  {form.formState.isSubmitting
                    ? <SpinnerBtn label={editEntry ? "Saving" : "Creating"} />
                    : editEntry ? "Save changes" : "Create"
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

function EntryGroup({
  label, icon: Icon, color, entries, toggling, deleting, onEdit, onToggle, onDelete,
}: {
  label:    string
  icon:     LucideIcon
  color:    string
  entries:  RecurringTransaction[]
  toggling: string | null
  deleting: string | null
  onEdit:   (e: RecurringTransaction) => void
  onToggle: (e: RecurringTransaction) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={color} />
        <p className="text-[12px] font-semibold text-stone-600 uppercase tracking-[0.08em] mono">{label}</p>
        <span className="mono text-[10px] text-stone-400">{entries.length} entr{entries.length !== 1 ? "ies" : "y"}</span>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        {entries.map((e) => {
          const AccIcon  = ACCOUNT_ICONS[e.account?.type ?? "cash"] ?? Wallet
          const isIncome = e.type === "income"
          return (
            <div key={e.id} className={cn("flex items-center gap-3 px-5 py-4 border-b border-stone-50 last:border-0 transition-colors", !e.is_active && "opacity-50")}>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isIncome ? "bg-emerald-50" : "bg-red-50")}>
                {isIncome ? <TrendingUp size={15} className="text-emerald-600" /> : <TrendingDown size={15} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-stone-800 truncate">
                  {e.note ?? e.category ?? (isIncome ? "Income" : "Expense")}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <AccIcon size={9} className="text-stone-400" />
                  <p className="mono text-[10px] text-stone-400">{e.account?.name}</p>
                  <span className="text-stone-200">·</span>
                  <Calendar size={9} className="text-stone-400" />
                  <p className="mono text-[10px] text-stone-400">Every {ordinal(e.day_of_month)}</p>
                  {e.last_run_at && (
                    <>
                      <span className="text-stone-200">·</span>
                      <p className="mono text-[10px] text-stone-300">
                        Last: {new Date(e.last_run_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <p className={cn("mono text-[13px] font-semibold shrink-0", isIncome ? "text-emerald-600" : "text-red-500")}>
                {isIncome ? "+" : "−"}₱{e.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggle(e)}
                  disabled={toggling === e.id}
                  className={cn(
                    "mono text-[9px] px-2 py-1 rounded-lg border transition-colors",
                    e.is_active
                      ? "bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                  )}
                >
                  {toggling === e.id ? "..." : e.is_active ? "Pause" : "Resume"}
                </button>
                <button onClick={() => onEdit(e)} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
                  <Pencil size={12} />
                </button>
                <button onClick={() => onDelete(e.id)} disabled={deleting === e.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chevron() {
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

function Err({ msg }: { msg: string }) {
  return <p className="mono text-[10px] text-red-400">— {msg}</p>
}