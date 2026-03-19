import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import {
  transactionSchema, type TransactionForm,
  type Account, TRANSACTION_CATEGORIES,
} from "@/types/Accounts"
import {
  getAccounts, getTransactions, createTransaction,
  deleteTransaction, getMonthSummary,
  type TransactionWithAccount,
} from "@/services/AccountService"
import SettingsSelect from "@/components/customs/SettingsSelect"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import {
  Plus, TrendingUp, TrendingDown, ArrowLeftRight,
  Trash2, X, Wallet, Building2, CreditCard, Smartphone,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  income:   TrendingUp,
  expense:  TrendingDown,
  transfer: ArrowLeftRight,
}

const TYPE_COLORS = {
  income:   "text-emerald-600 bg-emerald-50",
  expense:  "text-red-500 bg-red-50",
  transfer: "text-sky-600 bg-sky-50",
}

const ACCOUNT_ICONS = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

function formatDate(dateStr: string) {
  const d         = new Date(dateStr + "T00:00:00")
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString())     return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Transactions() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const now = new Date()

  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([])
  const [accounts,     setAccounts]     = useState<Account[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [filterType,   setFilterType]   = useState<string>("all")
  const [summary,      setSummary]      = useState({ income: 0, expenses: 0, net: 0 })

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id:    "",
      amount:        undefined,
      type:          "expense",
      category:      "",
      note:          "",
      date:          now.toISOString().split("T")[0],
      to_account_id: "",
    },
  })

  const watchType      = form.watch("type")
  const watchAccountId = form.watch("account_id")

  // ── Load ──────────────────────────────────────────────────────────────────

  // ✅ stable with useCallback — won't recreate on every render
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [txns, accs, sum] = await Promise.all([
      getTransactions(user.id, { limit: 50 }),
      getAccounts(user.id),
      getMonthSummary(user.id, now.getMonth() + 1, now.getFullYear()),
    ])
    setTransactions(txns)
    setAccounts(accs)
    setSummary(sum)
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    form.reset({
      account_id:    accounts[0]?.id ?? "",
      amount:        undefined,
      type:          "expense",
      category:      "",
      note:          "",
      date:          new Date().toISOString().split("T")[0],
      to_account_id: "",
    })
    setShowModal(true)
  }

  const onSubmit = async (data: TransactionForm) => {
    if (!user) return
    const { error } = await createTransaction(user.id, data)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
      return
    }
    toast({ type: "success", title: "Transaction added" })
    setShowModal(false)
    load()  // ✅ reloads both transactions AND accounts (balances update)
  }

  const handleDelete = async (id: string) => {
    const error = await deleteTransaction(id)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Transaction removed" })
      load()  // ✅ reloads both so balances reflect deletion
    }
  }

  // ── Filtered + Grouped ────────────────────────────────────────────────────

  const filtered = transactions.filter((t) =>
    filterType === "all" ? true : t.type === filterType
  )

  const grouped = filtered.reduce<Record<string, TransactionWithAccount[]>>((acc, t) => {
    const key = formatDate(t.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-reveal">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Transactions</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">
            {now.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={accounts.length === 0}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4"
        >
          <Plus size={13} /> Add transaction
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-stone-200 border-t-2 border-t-emerald-400 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <p className="mono text-[10px] uppercase tracking-[0.12em] text-stone-400 mb-2">Income</p>
          <p className="text-[22px] font-semibold text-stone-900 tracking-tight">
            ₱{summary.income.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 border-t-2 border-t-red-400 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <p className="mono text-[10px] uppercase tracking-[0.12em] text-stone-400 mb-2">Expenses</p>
          <p className="text-[22px] font-semibold text-stone-900 tracking-tight">
            ₱{summary.expenses.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cn(
          "bg-white rounded-2xl border border-stone-200 border-t-2 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]",
          summary.net >= 0 ? "border-t-emerald-400" : "border-t-red-400"
        )}>
          <p className="mono text-[10px] uppercase tracking-[0.12em] text-stone-400 mb-2">Net</p>
          <p className={cn(
            "text-[22px] font-semibold tracking-tight",
            summary.net >= 0 ? "text-emerald-600" : "text-red-500"
          )}>
            {summary.net >= 0 ? "+" : ""}₱{Math.abs(summary.net).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-4">
        {[
          { value: "all",      label: "All"       },
          { value: "expense",  label: "Expenses"  },
          { value: "income",   label: "Income"    },
          { value: "transfer", label: "Transfers" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={cn(
              "mono text-[11px] px-3 py-1.5 rounded-lg transition-colors",
              filterType === value
                ? "bg-emerald-50 text-emerald-700"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-50 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              <div className="w-9 h-9 bg-stone-100 rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-stone-100 rounded mb-1.5" />
                <div className="h-2.5 w-20 bg-stone-100 rounded" />
              </div>
              <div className="h-3 w-16 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <TrendingDown size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-stone-600">No transactions yet</p>
          <p className="mono text-[11px] text-stone-400 mt-1 mb-4">
            {accounts.length === 0
              ? "Add an account first, then start tracking"
              : "Add your first transaction to get started"
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          {Object.entries(grouped).map(([dateLabel, txns]) => (
            <div key={dateLabel}>
              <div className="px-5 py-2 bg-stone-50 border-b border-stone-100">
                <p className="mono text-[10px] text-stone-400 uppercase tracking-[0.1em]">{dateLabel}</p>
              </div>
              {txns.map((t) => {
                const Icon    = TYPE_ICONS[t.type]
                const AccIcon = ACCOUNT_ICONS[t.account?.type ?? "cash"]
                const isExpense  = t.type === "expense"
                const isIncome   = t.type === "income"
                const isTransfer = t.type === "transfer"

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors group"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", TYPE_COLORS[t.type])}>
                      <Icon size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-stone-800 truncate">
                        {t.note || t.category || t.type}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <AccIcon size={9} className="text-stone-400" />
                        {/* ✅ Show "From → To" for transfers */}
                        {isTransfer ? (
                          <p className="mono text-[10px] text-stone-400">
                            {t.account?.name}
                            {t.to_account?.name && (
                              <span> → {t.to_account.name}</span>
                            )}
                          </p>
                        ) : (
                          <>
                            <p className="mono text-[10px] text-stone-400">{t.account?.name}</p>
                            {t.category && (
                              <>
                                <span className="text-stone-300">·</span>
                                <p className="mono text-[10px] text-stone-400">{t.category}</p>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={cn(
                        "mono text-[13px] font-medium",
                        isIncome   ? "text-emerald-600" :
                        isExpense  ? "text-stone-800"   :
                                     "text-sky-600"
                      )}>
                        {isIncome ? "+" : isExpense ? "−" : ""}
                        ₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(t.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Add transaction modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
              <h2 className="text-[15px] font-semibold text-stone-900">Add transaction</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

              {/* Type toggle */}
              <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue("type", t)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize",
                      watchType === t
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {t}
                  </button>
                ))}
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
                    className={cn(
                      "h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
                      form.formState.errors.amount && "border-red-300"
                    )}
                    {...form.register("amount", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.amount && (
                  <p className="mono text-[10px] text-red-400">— {form.formState.errors.amount.message}</p>
                )}
              </div>

              {/* From account */}
              <SettingsSelect
                label={watchType === "transfer" ? "From account" : "Account"}
                error={form.formState.errors.account_id?.message}
                {...form.register("account_id")}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · ₱{a.balance.toLocaleString()}
                  </option>
                ))}
              </SettingsSelect>

              {/* Transfer — destination account */}
              {watchType === "transfer" && (
                <SettingsSelect
                  label="To account"
                  error={form.formState.errors.to_account_id?.message}
                  {...form.register("to_account_id")}
                >
                  <option value="">Select destination</option>
                  {accounts
                    .filter((a) => a.id !== watchAccountId)  // ✅ excludes source account
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · ₱{a.balance.toLocaleString()}
                      </option>
                    ))
                  }
                </SettingsSelect>
              )}

              {/* Category — hidden for transfers */}
              {watchType !== "transfer" && (
                <SettingsSelect label="Category" {...form.register("category")}>
                  <option value="">No category</option>
                  {TRANSACTION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </SettingsSelect>
              )}

              {/* Note + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Note</Label>
                  <Input
                    placeholder="Optional"
                    className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                    {...form.register("note")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Date</Label>
                  <Input
                    type="date"
                    className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                    {...form.register("date")}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="text-[12px] h-9 border-stone-200 text-stone-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5"
                >
                  {form.formState.isSubmitting ? <SpinnerBtn label="Adding" /> : "Add transaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}