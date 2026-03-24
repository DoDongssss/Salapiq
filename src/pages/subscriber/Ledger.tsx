import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import { useFamilyStore }  from "@/stores/useFamilyStore"
import {
  type Account, TRANSACTION_CATEGORIES,
  type TransactionWithAccount, type TransactionFilters,
} from "@/types"
import {
  getTransactions, deleteTransaction, getMonthSummary, getTotalBalance,
  deleteAccount,
} from "@/services/AccountService"
import { getTransactionIdsWithSplits } from "@/services/SplitService"
import {
  TRANSACTION_TYPE_ICONS, TRANSACTION_TYPE_COLORS,
  TRANSACTION_AMOUNT_COLORS, TRANSACTION_AMOUNT_PREFIX,
  ACCOUNT_TYPE_ICONS,
} from "@/config/transactions"
import {
  PAGE_SIZE, DATE_PRESETS, TYPE_OPTIONS,
  type DatePreset as Date_Preset, type TypeFilter as Type_Filter,
} from "@/config/ledger"
import { formatDate, currentMonthLabel, formatCurrency } from "@/lib/utils"
import SummaryCard          from "@/components/customs/SummaryCard"
import Pagination           from "@/components/customs/Pagination"
import AddAccountModal      from "@/components/modals/AddAccountModal"
import TransactionModal     from "@/components/modals/TransactionModal"
import SplitModal           from "@/components/modals/SplitModal"
import {
  Wallet, Building2, CreditCard, Smartphone,
  MoreHorizontal, Pencil, Trash2, X, Plus,
  TrendingDown, Search, SlidersHorizontal,
  SplitSquareHorizontal, TrendingUp,
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
  bank:    "Bank",
  debit:   "Debit",
  ewallet: "E-wallet",
  cash:    "Cash",
}

function buildFilters(
  page:            number,
  debouncedSearch: string,
  typeFilter:      TypeFilter,
  categoryFilter:  string,
  datePreset:      DatePreset,
  customFrom:      string,
  customTo:        string,
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
    page, pageSize: PAGE_SIZE,
    search:    debouncedSearch || undefined,
    type:      typeFilter    === "all" ? undefined : typeFilter,
    category:  categoryFilter === ""   ? undefined : categoryFilter,
    accountId: selectedAccount ?? undefined,
    from, to,
  }
}

function FilterSelect({
  value, onChange, children,
}: {
  value:    string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-3 pr-7 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}

export default function Ledger() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const accounts         = useAccountStore((s) => s.accounts)
  const accountsLoading  = useAccountStore((s) => s.loading)
  const refreshAccounts  = useAccountStore((s) => s.refresh)
  const lastAdded        = useAccountStore((s) => s.lastAdded)
  const family           = useFamilyStore((s) => s.family)
  const familyAccountIds = new Set(
    accounts.filter((a) => a.family_id === family?.id).map((a) => a.id)
  )

  const [transactions,     setTransactions]     = useState<TransactionWithAccount[]>([])
  const [total,            setTotal]            = useState(0)
  const [totalPages,       setTotalPages]       = useState(1)
  const [txnLoading,       setTxnLoading]       = useState(true)
  const [summary,          setSummary]          = useState({ income: 0, expenses: 0, net: 0 })
  const [txnIdsWithSplits, setTxnIdsWithSplits] = useState<Set<string>>(new Set())

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [page,            setPage]            = useState(1)
  const [search,          setSearch]          = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [datePreset,      setDatePreset]      = useState<DatePreset>("today")
  const [customFrom,      setCustomFrom]      = useState("")
  const [customTo,        setCustomTo]        = useState("")
  const [typeFilter,      setTypeFilter]      = useState<TypeFilter>("all")
  const [categoryFilter,  setCategoryFilter]  = useState("")
  const [filtersOpen,     setFiltersOpen]     = useState(false)

  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [editingAccount,   setEditingAccount]   = useState<Account | null>(null)
  const [editingTxn,       setEditingTxn]       = useState<TransactionWithAccount | null>(null)
  const [splittingTxn,     setSplittingTxn]     = useState<TransactionWithAccount | null>(null)
  const [menuOpen,         setMenuOpen]         = useState<string | null>(null)
  const [deleting,         setDeleting]         = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    const ids  = transactions.map((t) => t.id)
    const work = ids.length
      ? getTransactionIdsWithSplits(ids)
      : Promise.resolve(new Set<string>())
    work.then((result) => { if (!cancelled) setTxnIdsWithSplits(result) })
    return () => { cancelled = true }
  }, [transactions])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
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
      setTransactions(result.data); setTotal(result.total)
      setTotalPages(result.totalPages); setSummary(sum)
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
    setTransactions(result.data); setTotal(result.total)
    setTotalPages(result.totalPages); setSummary(sum)
  }

  const handleDeleteTxn = async (id: string) => {
    const error = await deleteTransaction(id)
    if (error) { toast({ type: "error", title: "Failed to delete", description: error }) }
    else {
      toast({ type: "info", title: "Transaction removed" })
      if (user) refreshAccounts(user.id)
      reloadTxns()
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!user) return
    setDeleting(id)
    const error = await deleteAccount(id)
    setDeleting(null); setMenuOpen(null)
    if (error) { toast({ type: "error", title: "Failed to delete", description: error }) }
    else {
      toast({ type: "info", title: "Account removed" })
      if (selectedAccount === id) setSelectedAccount(null)
      await refreshAccounts(user.id)
    }
  }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearch(""); setDebouncedSearch(""); setDatePreset("today")
    setCustomFrom(""); setCustomTo(""); setTypeFilter("all")
    setCategoryFilter(""); setSelectedAccount(null); setPage(1)
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
    <div className="page-reveal space-y-3">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">Ledger</h1>
          <p className="mono text-[11px] text-stone-400 mt-0.5">{currentMonthLabel()}</p>
        </div>
        {!txnLoading && (
          <p className="mono text-[11px] text-stone-400 shrink-0 ml-2">{total.toLocaleString()} txns</p>
        )}
      </div>

      <div className="bg-[#0f1a12] rounded-2xl p-4 sm:p-5">
        <p className="mono text-[9px] tracking-[0.15em] uppercase text-emerald-900 mb-0.5">Total balance</p>
        <p className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-none mb-0.5">
          ₱{totalBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
        <p className="mono text-[9px] text-emerald-900 mb-3">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => { setSelectedAccount(null); setPage(1) }}
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-full text-[10px] border transition-all whitespace-nowrap",
              selectedAccount === null
                ? "bg-white/15 border-white/25 text-white"
                : "border-white/10 text-white/50 hover:bg-white/10"
            )}
          >
            All
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedAccount(selectedAccount === a.id ? null : a.id); setPage(1) }}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border transition-all whitespace-nowrap",
                selectedAccount === a.id
                  ? "bg-white/15 border-white/25 text-white"
                  : "border-white/10 text-white/50 hover:bg-white/10"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              <span className="max-w-[72px] truncate">{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard label="Income"   value={summary.income}      color="emerald" Icon={TrendingUp}     sub="All time" />
        <SummaryCard label="Expenses" value={summary.expenses}    color="red"     Icon={TrendingDown}   sub="All time" />
        <SummaryCard label="Net"      value={summary.net}         color="sky"     Icon={Wallet}         sub="All time"/>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {accountsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] w-[130px] shrink-0 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))
        ) : (
          <>
            {accounts.map((account) => {
              const Icon   = ACCOUNT_TYPE_ICON_MAP[account.type]
              const active = selectedAccount === account.id
              return (
                <div
                  key={account.id}
                  onClick={() => { setSelectedAccount(active ? null : account.id); setPage(1) }}
                  className={cn(
                    "relative bg-white rounded-2xl border p-3 shrink-0 w-[132px] cursor-pointer transition-all",
                    active
                      ? "border-emerald-400 shadow-[0_0_0_1px_#34d399]"
                      : "border-stone-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: account.color + "20" }}
                  >
                    <Icon size={12} style={{ color: account.color }} />
                  </div>
                  <p className="text-[11px] font-medium text-stone-800 truncate leading-tight pr-5">{account.name}</p>
                  <p className="mono text-[9px] text-stone-400 mt-0.5 mb-1.5 leading-tight">{ACCOUNT_TYPE_LABELS[account.type]}</p>
                  <p className="mono text-[11px] font-medium text-stone-900 truncate">
                    {/* ₱{account.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })} */}
                    { formatCurrency(account.balance, '₱') }
                  </p>

                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === account.id ? null : account.id) }}
                      className="w-5 h-5 rounded-md flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <MoreHorizontal size={11} />
                    </button>
                    {menuOpen === account.id && (
                      <div className="absolute right-0 top-6 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-20 w-32">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingAccount(account); setAccountModalOpen(true); setMenuOpen(null)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-stone-700 hover:bg-stone-50"
                        >
                          <Pencil size={10} /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id) }}
                          disabled={deleting === account.id}
                          className="flex items-center gap-2 w-full px-3 py-2 text-[11px] text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={10} />
                          {deleting === account.id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => { setEditingAccount(null); setAccountModalOpen(true) }}
              className="shrink-0 w-[100px] bg-white border border-dashed border-stone-300 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors group"
            >
              <div className="w-7 h-7 rounded-xl bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <Plus size={13} className="text-stone-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <p className="mono text-[9px] text-stone-400 group-hover:text-emerald-600 transition-colors text-center leading-tight">
                Add account
              </p>
            </button>
          </>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-3">

        {/* Always-visible row: search + filter toggle (mobile) / search + selects (desktop) */}
        <div className="flex items-center gap-2">

          <div className="relative flex-1 min-w-0">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-7 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600">
                <X size={11} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "sm:hidden shrink-0 flex items-center gap-1.5 h-9 px-2.5 mono text-[11px] border rounded-xl transition-colors",
              filtersOpen || hasActiveFilters
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-stone-50 border-stone-200 text-stone-500"
            )}
          >
            <SlidersHorizontal size={12} />
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <FilterSelect
              value={datePreset}
              onChange={(v) => {
                setDatePreset(v as DatePreset); setPage(1)
                if (v !== "custom") { setCustomFrom(""); setCustomTo("") }
              }}
            >
              {DATE_PRESETS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </FilterSelect>

            <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1) }}>
              {TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </FilterSelect>

            <FilterSelect value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1) }}>
              <option value="">All categories</option>
              {TRANSACTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="shrink-0 flex items-center gap-1 h-9 px-3 mono text-[11px] text-stone-500 hover:text-red-500 hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-xl transition-colors"
              >
                <X size={11} /> Reset
              </button>
            )}
          </div>
        </div>

        {datePreset === "custom" && (
          <div className="hidden sm:flex items-center gap-2 mt-2">
            <input type="date" value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setPage(1) }}
              className="h-9 px-3 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="mono text-[11px] text-stone-400">to</span>
            <input type="date" value={customTo}
              onChange={(e) => { setCustomTo(e.target.value); setPage(1) }}
              className="h-9 px-3 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        )}

        {filtersOpen && (
          <div className="sm:hidden mt-2.5 pt-2.5 border-t border-stone-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <FilterSelect
                value={datePreset}
                onChange={(v) => {
                  setDatePreset(v as DatePreset); setPage(1)
                  if (v !== "custom") { setCustomFrom(""); setCustomTo("") }
                }}
              >
                {DATE_PRESETS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </FilterSelect>

              <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1) }}>
                {TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </FilterSelect>
            </div>

            <FilterSelect value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1) }}>
              <option value="">All categories</option>
              {TRANSACTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>

            {datePreset === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setPage(1) }}
                  className="h-9 px-3 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <input type="date" value={customTo}
                  onChange={(e) => { setCustomTo(e.target.value); setPage(1) }}
                  className="h-9 px-3 mono text-[12px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => { handleReset(); setFiltersOpen(false) }}
                className="w-full flex items-center justify-center gap-1.5 h-9 mono text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-xl transition-colors"
              >
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {txnLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-50 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-8 h-8 bg-stone-100 rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-2.5 w-28 bg-stone-100 rounded mb-1.5" />
                <div className="h-2 w-16 bg-stone-100 rounded" />
              </div>
              <div className="h-2.5 w-14 bg-stone-100 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 py-12 text-center">
          <TrendingDown size={28} className="text-stone-200 mx-auto mb-3" />
          <p className="text-[13px] font-medium text-stone-600">
            {debouncedSearch ? "No results found" : datePreset === "today" ? "No transactions today" : "No transactions found"}
          </p>
          <p className="mono text-[11px] text-stone-400 mt-1 px-8">
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

                <div className="px-4 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                  <p className="mono text-[9px] text-stone-400 uppercase tracking-[0.1em]">{dateLabel}</p>
                  <p className="mono text-[9px] text-stone-300">{txns.length} item{txns.length !== 1 ? "s" : ""}</p>
                </div>

                {txns.map((t) => {
                  const Icon       = TRANSACTION_TYPE_ICONS[t.type]
                  const AccIcon    = ACCOUNT_TYPE_ICONS[t.account?.type ?? "cash"]
                  const isTransfer = t.type === "transfer"
                  const canSplit   =
                    family &&
                    t.type === "expense" &&
                    !t.is_split &&
                    !txnIdsWithSplits.has(t.id) &&
                    familyAccountIds.has(t.account_id) &&
                    family.members.find((m) => m.user_id === user?.id)?.role === "admin"

                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors group"
                    >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", TRANSACTION_TYPE_COLORS[t.type])}>
                        <Icon size={13} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-stone-800 truncate leading-snug">
                          {t.note || t.category || t.type}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 min-w-0">
                          <AccIcon size={9} className="text-stone-400 shrink-0" />
                          <p className="mono text-[9px] text-stone-400 truncate">
                            {isTransfer
                              ? `${t.account?.name ?? ""}${t.to_account?.name ? ` → ${t.to_account.name}` : ""}`
                              : `${t.account?.name ?? ""}${t.category ? ` · ${t.category}` : ""}`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cn("mono text-[11px] font-medium tabular-nums", TRANSACTION_AMOUNT_COLORS[t.type])}>
                          {TRANSACTION_AMOUNT_PREFIX[t.type]}₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="mono text-[9px] text-stone-300 mt-0.5">
                          {new Date(t.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTxn(t)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteTxn(t.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                        {canSplit && (
                          <button
                            onClick={() => setSplittingTxn(t)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                            title="Split expense"
                          >
                            <SplitSquareHorizontal size={11} />
                          </button>
                        )}
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
        <TransactionModal
          open={!!editingTxn}
          transaction={editingTxn}
          onClose={() => setEditingTxn(null)}
          onDone={reloadTxns}
        />
      )}
      {splittingTxn && (
        <SplitModal
          transactionId={splittingTxn.id}
          totalAmount={splittingTxn.amount}
          onClose={() => setSplittingTxn(null)}
          onSplit={() => { setSplittingTxn(null); reloadTxns() }}
        />
      )}
    </div>
  )
}