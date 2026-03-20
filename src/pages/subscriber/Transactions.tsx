import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import {
  getTransactions, deleteTransaction,
  getMonthSummary, type TransactionWithAccount,
  type TransactionFilters,
} from "@/services/AccountService"
import {
  TRANSACTION_TYPE_ICONS, TRANSACTION_TYPE_COLORS,
  TRANSACTION_AMOUNT_COLORS, TRANSACTION_AMOUNT_PREFIX,
  ACCOUNT_TYPE_ICONS,
} from "@/config/subscriber"
import { formatDate, currentMonthLabel } from "@/lib/utils"
import SummaryCard from "@/components/customs/SummaryCard"
import Pagination from "@/components/customs/Pagination"
import { TrendingDown, Trash2, Search, X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_SIZE     = 5
const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR  = new Date().getFullYear()

type DatePreset = "today" | "week" | "month" | "all"
type TypeFilter = "all" | "income" | "expense" | "transfer"

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today"      },
  { value: "week",  label: "This week"  },
  { value: "month", label: "This month" },
  { value: "all",   label: "All time"   },
]

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all",      label: "All types" },
  { value: "expense",  label: "Expenses"  },
  { value: "income",   label: "Income"    },
  { value: "transfer", label: "Transfers" },
]

function getDateBounds(preset: DatePreset): { from?: string; to?: string } {
  const now   = new Date()
  const today = now.toISOString().split("T")[0]

  if (preset === "today") return { from: today, to: today }

  if (preset === "week") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { from: start.toISOString().split("T")[0], to: today }
  }

  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString().split("T")[0], to: today }
  }

  return {}
}

export default function Transactions() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const accounts        = useAccountStore((s) => s.accounts)
  const refreshAccounts = useAccountStore((s) => s.refresh)
  const lastAdded       = useAccountStore((s) => s.lastAdded)

  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [summary,      setSummary]      = useState({ income: 0, expenses: 0, net: 0 })

  const [page,          setPage]          = useState(1)
  const [search,        setSearch]        = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [datePreset,    setDatePreset]    = useState<DatePreset>("today")
  const [typeFilter,    setTypeFilter]    = useState<TypeFilter>("all")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const bounds = getDateBounds(datePreset)
      const filters: TransactionFilters = {
        page:     page,
        pageSize: PAGE_SIZE,
        search:   debouncedSearch || undefined,
        type:     typeFilter === "all" ? undefined : typeFilter,
        ...bounds,
      }

      const [result, sum] = await Promise.all([
        getTransactions(user.id, filters),
        getMonthSummary(user.id, CURRENT_MONTH, CURRENT_YEAR),
      ])

      if (cancelled) return
      setTransactions(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setSummary(sum)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [user, page, debouncedSearch, typeFilter, datePreset, lastAdded])

  const reload = async () => {
    if (!user) return
    const bounds = getDateBounds(datePreset)
    const filters: TransactionFilters = {
      page:     page,
      pageSize: PAGE_SIZE,
      search:   debouncedSearch || undefined,
      type:     typeFilter === "all" ? undefined : typeFilter,
      ...bounds,
    }
    const [result, sum] = await Promise.all([
      getTransactions(user.id, filters),
      getMonthSummary(user.id, CURRENT_MONTH, CURRENT_YEAR),
    ])
    setTransactions(result.data)
    setTotal(result.total)
    setTotalPages(result.totalPages)
    setSummary(sum)
  }

  const handleDelete = async (id: string) => {
    const error = await deleteTransaction(id)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Transaction removed" })
      if (user) refreshAccounts(user.id)
      reload()
    }
  }

  const handleDatePreset = (val: DatePreset) => {
    setDatePreset(val)
    setPage(1)
  }

  const handleTypeFilter = (val: TypeFilter) => {
    setTypeFilter(val)
    setPage(1)
  }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearch("")
    setDebouncedSearch("")
    setDatePreset("today")
    setTypeFilter("all")
    setPage(1)
  }

  const grouped = transactions.reduce<Record<string, TransactionWithAccount[]>>((acc, t) => {
    const key = formatDate(t.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  const hasActiveFilters = typeFilter !== "all" || debouncedSearch !== "" || datePreset !== "today"

  return (
    <div className="page-reveal">

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Transactions</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">{currentMonthLabel()}</p>
        </div>
        {!loading && (
          <p className="mono text-[11px] text-stone-400">
            {total.toLocaleString()} total
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Income"   value={summary.income}   accentColor="border-t-emerald-400" />
        <SummaryCard label="Expenses" value={summary.expenses} accentColor="border-t-red-400" />
        <SummaryCard
          label="Net"
          value={summary.net}
          accentColor={summary.net >= 0 ? "border-t-emerald-400" : "border-t-red-400"}
          valueClass={summary.net >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">

          <div className="relative flex-1 min-w-[200px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search note or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-8 text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors mono"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => handleDatePreset(e.target.value as DatePreset)}
              className="h-9 pl-3 pr-8 text-[12px] mono bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors appearance-none cursor-pointer"
            >
              {DATE_PRESETS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value as TypeFilter)}
              className="h-9 pl-3 pr-8 text-[12px] mono bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors appearance-none cursor-pointer"
            >
              {TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 h-9 px-3 mono text-[11px] text-stone-500 hover:text-red-500 hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-xl transition-colors"
            >
              <SlidersHorizontal size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-50 overflow-hidden">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center">
          <TrendingDown size={32} className="text-stone-200 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-stone-600">
            {debouncedSearch
              ? "No results found"
              : datePreset === "today"
              ? "No transactions today"
              : "No transactions found"
            }
          </p>
          <p className="mono text-[11px] text-stone-400 mt-1.5">
            {accounts.length === 0
              ? "Add an account first, then start tracking"
              : debouncedSearch
              ? `Nothing matches "${debouncedSearch}"`
              : "Try a different date range or filter"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            {Object.entries(grouped).map(([dateLabel, txns]) => (
              <div key={dateLabel}>
                <div className="px-5 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                  <p className="mono text-[10px] text-stone-400 uppercase tracking-[0.1em]">{dateLabel}</p>
                  <p className="mono text-[10px] text-stone-300">{txns.length} item{txns.length !== 1 ? "s" : ""}</p>
                </div>
                {txns.map((t) => {
                  const Icon       = TRANSACTION_TYPE_ICONS[t.type]
                  const AccIcon    = ACCOUNT_TYPE_ICONS[t.account?.type ?? "cash"]
                  const isTransfer = t.type === "transfer"
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors group"
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", TRANSACTION_TYPE_COLORS[t.type])}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-stone-800 truncate">
                          {t.note || t.category || t.type}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <AccIcon size={9} className="text-stone-400" />
                          {isTransfer ? (
                            <p className="mono text-[10px] text-stone-400">
                              {t.account?.name}
                              {t.to_account?.name && <span> → {t.to_account.name}</span>}
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
                        <p className={cn("mono text-[13px] font-medium", TRANSACTION_AMOUNT_COLORS[t.type])}>
                          {TRANSACTION_AMOUNT_PREFIX[t.type]}₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="mono text-[9px] text-stone-300 mt-0.5">
                          {new Date(t.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
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

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}