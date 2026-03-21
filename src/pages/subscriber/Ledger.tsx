import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import {
  type Account, TRANSACTION_CATEGORIES,
} from "@/types/AccountTypes"
import {
  getTransactions, deleteTransaction, getMonthSummary, getTotalBalance,
  type TransactionWithAccount, type TransactionFilters,
} from "@/services/AccountService"
import {
  deleteAccount,
} from "@/services/AccountService"
import {
  TRANSACTION_TYPE_ICONS, TRANSACTION_TYPE_COLORS,
  TRANSACTION_AMOUNT_COLORS, TRANSACTION_AMOUNT_PREFIX,
  ACCOUNT_TYPE_ICONS,
  PAGE_SIZE, DATE_PRESETS, TYPE_OPTIONS,
  type DatePreset as Date_Preset, type TypeFilter as Type_Filter,
} from "@/config/subscriber"
import { formatDate, currentMonthLabel } from "@/lib/utils"
import SummaryCard           from "@/components/customs/SummaryCard"
import Pagination            from "@/components/customs/Pagination"
import AddAccountModal       from "@/components/modals/AddAccountModal"
import EditTransactionModal  from "@/components/modals/EditTransactionModal"
import {
  Wallet, Building2, CreditCard, Smartphone,
  MoreHorizontal, Pencil, Trash2, X, Plus,
  TrendingDown, Search, SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR  = new Date().getFullYear()

type DatePreset = Date_Preset
type TypeFilter = Type_Filter

const ACCOUNT_TYPE_ICON_MAP: Record<string, LucideIcon> = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank:    "Bank account",
  debit:   "Debit card",
  ewallet: "E-wallet",
  cash:    "Cash wallet",
}

function buildFilters(
  page: number,
  debouncedSearch: string,
  typeFilter: TypeFilter,
  categoryFilter: string,
  datePreset: DatePreset,
  customFrom: string,
  customTo: string,
  selectedAccount: string | null
): TransactionFilters {
  const now   = new Date()
  const today = now.toISOString().split("T")[0]

  let from: string | undefined
  let to:   string | undefined

  if (datePreset === "today") {
    from = today; to = today
  } else if (datePreset === "week") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    from = start.toISOString().split("T")[0]; to = today
  } else if (datePreset === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    to   = today
  } else if (datePreset === "custom") {
    from = customFrom || undefined
    to   = customTo   || undefined
  }

  return {
    page,
    pageSize:  PAGE_SIZE,
    search:    debouncedSearch || undefined,
    type:      typeFilter    === "all" ? undefined : typeFilter,
    category:  categoryFilter === ""  ? undefined : categoryFilter,
    accountId: selectedAccount ?? undefined,
    from,
    to,
  }
}


export default function Ledger() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const accounts        = useAccountStore((s) => s.accounts)
  const accountsLoading = useAccountStore((s) => s.loading)
  const refreshAccounts = useAccountStore((s) => s.refresh)
  const lastAdded       = useAccountStore((s) => s.lastAdded)

  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [txnLoading,   setTxnLoading]   = useState(true)
  const [summary,      setSummary]      = useState({ income: 0, expenses: 0, net: 0 })

  const [selectedAccount,  setSelectedAccount]  = useState<string | null>(null)
  const [page,             setPage]             = useState(1)
  const [search,           setSearch]           = useState("")
  const [debouncedSearch,  setDebouncedSearch]  = useState("")
  const [datePreset,       setDatePreset]       = useState<DatePreset>("today")
  const [customFrom,       setCustomFrom]       = useState("")
  const [customTo,         setCustomTo]         = useState("")
  const [typeFilter,       setTypeFilter]       = useState<TypeFilter>("all")
  const [categoryFilter,   setCategoryFilter]   = useState("")

  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [editingAccount,   setEditingAccount]   = useState<Account | null>(null)
  const [editingTxn,       setEditingTxn]       = useState<TransactionWithAccount | null>(null)
  const [menuOpen,         setMenuOpen]         = useState<string | null>(null)
  const [deleting,         setDeleting]         = useState<string | null>(null)

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
      setTxnLoading(true)
      const filters = buildFilters(page, debouncedSearch, typeFilter, categoryFilter, datePreset, customFrom, customTo, selectedAccount)
      const [result, sum] = await Promise.all([
        getTransactions(user.id, filters),
        getMonthSummary(user.id, CURRENT_MONTH, CURRENT_YEAR),
      ])
      if (cancelled) return
      setTransactions(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setSummary(sum)
      setTxnLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [user, page, debouncedSearch, typeFilter, categoryFilter, datePreset, customFrom, customTo, selectedAccount, lastAdded])

  const reloadTxns = async () => {
    if (!user) return
    const filters = buildFilters(page, debouncedSearch, typeFilter, categoryFilter, datePreset, customFrom, customTo, selectedAccount)
    const [result, sum] = await Promise.all([
      getTransactions(user.id, filters),
      getMonthSummary(user.id, CURRENT_MONTH, CURRENT_YEAR),
    ])
    setTransactions(result.data)
    setTotal(result.total)
    setTotalPages(result.totalPages)
    setSummary(sum)
  }

  const handleDeleteTxn = async (id: string) => {
    const error = await deleteTransaction(id)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Transaction removed" })
      if (user) refreshAccounts(user.id)
      reloadTxns()
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!user) return
    setDeleting(id)
    const error = await deleteAccount(id)
    setDeleting(null)
    setMenuOpen(null)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Account removed" })
      if (selectedAccount === id) setSelectedAccount(null)
      await refreshAccounts(user.id)
    }
  }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearch("")
    setDebouncedSearch("")
    setDatePreset("today")
    setCustomFrom("")
    setCustomTo("")
    setTypeFilter("all")
    setCategoryFilter("")
    setSelectedAccount(null)
    setPage(1)
  }

  const totalBalance     = getTotalBalance(accounts)
  const hasActiveFilters = typeFilter !== "all" || debouncedSearch !== "" || datePreset !== "today" || selectedAccount !== null || categoryFilter !== ""

  const grouped = transactions.reduce<Record<string, TransactionWithAccount[]>>((acc, t) => {
    const key = formatDate(t.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="page-reveal">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Ledger</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">{currentMonthLabel()}</p>
        </div>
        {!txnLoading && (
          <p className="mono text-[11px] text-stone-400">{total.toLocaleString()} transactions</p>
        )}
      </div>

      {/* Balance card */}
      <div className="bg-[#0f1a12] rounded-2xl p-5 mb-4">
        <p className="mono text-[10px] tracking-[0.15em] uppercase text-emerald-900 mb-1">Total balance</p>
        <p className="text-3xl font-semibold text-white tracking-tight">
          ₱{totalBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
        <p className="mono text-[10px] text-emerald-900 mt-1 mb-3">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedAccount(null); setPage(1) }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border transition-colors",
              selectedAccount === null
                ? "bg-white/15 border-white/25 text-white"
                : "bg-white/07 border-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            All accounts
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedAccount(selectedAccount === a.id ? null : a.id); setPage(1) }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border transition-colors",
                selectedAccount === a.id
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/07 border-white/10 text-white/60 hover:bg-white/10"
              )}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              {a.name} · ₱{a.balance.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <SummaryCard label="Income"   value={summary.income}   accentColor="border-t-emerald-400" />
        <SummaryCard label="Expenses" value={summary.expenses} accentColor="border-t-red-400" />
        <SummaryCard
          label="Net"
          value={summary.net}
          accentColor={summary.net >= 0 ? "border-t-emerald-400" : "border-t-red-400"}
          valueClass={summary.net >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      {/* Account strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 mb-4">
        {accountsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-40 bg-white rounded-2xl border border-stone-200 animate-pulse shrink-0" />
          ))
        ) : (
          <>
            {accounts.map((account) => {
              const Icon = ACCOUNT_TYPE_ICON_MAP[account.type]
              return (
                <div
                  key={account.id}
                  onClick={() => { setSelectedAccount(selectedAccount === account.id ? null : account.id); setPage(1) }}
                  className={cn(
                    "relative bg-white rounded-2xl border p-4 shrink-0 min-w-[155px] cursor-pointer transition-all",
                    selectedAccount === account.id
                      ? "border-emerald-400 shadow-[0_0_0_1px_#34d399]"
                      : "border-stone-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                  )}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: account.color + "20" }}>
                    <Icon size={14} style={{ color: account.color }} />
                  </div>
                  <p className="text-[12px] font-medium text-stone-800 truncate">{account.name}</p>
                  <p className="mono text-[9px] text-stone-400 mt-0.5 mb-2">{ACCOUNT_TYPE_LABELS[account.type]}</p>
                  <p className="mono text-[13px] font-medium text-stone-900">
                    ₱{account.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>

                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === account.id ? null : account.id) }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      <MoreHorizontal size={12} />
                    </button>
                    {menuOpen === account.id && (
                      <div className="absolute right-0 top-7 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-10 w-36">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingAccount(account); setAccountModalOpen(true); setMenuOpen(null) }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-stone-700 hover:bg-stone-50"
                        >
                          <Pencil size={11} /> Edit account
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id) }}
                          disabled={deleting === account.id}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={11} />
                          {deleting === account.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => { setEditingAccount(null); setAccountModalOpen(true) }}
              className="shrink-0 min-w-[120px] bg-white border border-dashed border-stone-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <Plus size={14} className="text-stone-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <p className="mono text-[10px] text-stone-400 group-hover:text-emerald-600 transition-colors">Add account</p>
            </button>
          </>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search note or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-8 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Date preset */}
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => { setDatePreset(e.target.value as DatePreset); setPage(1); if (e.target.value !== "custom") { setCustomFrom(""); setCustomTo("") } }}
              className="h-9 pl-3 pr-7 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              {DATE_PRESETS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          {/* Custom date range */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); setPage(1) }}
                className="h-9 px-3 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="mono text-[11px] text-stone-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(1) }}
                className="h-9 px-3 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1) }}
              className="h-9 pl-3 pr-7 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              {TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              className="h-9 pl-3 pr-7 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              <option value="">All categories</option>
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          {/* Reset */}
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

      {/* Transaction list */}
      {txnLoading ? (
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
            {debouncedSearch ? "No results found" : datePreset === "today" ? "No transactions today" : "No transactions found"}
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
                  const Icon    = TRANSACTION_TYPE_ICONS[t.type]
                  const AccIcon = ACCOUNT_TYPE_ICONS[t.account?.type ?? "cash"]
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => setEditingTxn(t)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteTxn(t.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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

      {accountModalOpen && (
        <AddAccountModal
          account={editingAccount}
          onClose={() => { setAccountModalOpen(false); setEditingAccount(null) }}
        />
      )}

      {editingTxn && (
        <EditTransactionModal
          transaction={editingTxn}
          accounts={accounts}
          onClose={() => setEditingTxn(null)}
          onUpdated={reloadTxns}
        />
      )}
    </div>
  )
}