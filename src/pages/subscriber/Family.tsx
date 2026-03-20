import { useState, useEffect, useCallback, useRef } from "react"
import { Routes, Route, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import {
  getMyFamily, getFamilyWithMembers, leaveFamily,
  removeMember, updateMemberRole, regenerateInviteCode,
  getFamilyAccounts, getFamilyTransactions,
  linkAccountToFamily, unlinkAccountFromFamily,
  type FamilyWithMembers, type FamilyMember,
  type FamilyTransactionFilters,
} from "@/services/FamilyService"
import type { TransactionWithAccount } from "@/services/AccountService"
import { getAccounts } from "@/services/AccountService"
import Avatar from "@/components/customs/Avatar"
import Pagination from "@/components/customs/Pagination"
import CreateFamilyModal from "@/components/modals/CreateFamilyModal"
import JoinFamilyModal from "@/components/modals/JoinFamilyModal"
import {
  Users, Home, Wallet, ArrowLeftRight,
  Plus, Copy, RefreshCw, LogOut,
  Crown, UserMinus, ChevronRight, X,
  TrendingUp, TrendingDown,
  Building2, CreditCard, Smartphone,
  Search, SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Account } from "@/types/AccountTypes"
import { useAccountStore } from "@/stores/useAccountStore"

const PAGE_SIZE = 10

const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

const NAV = [
  { to: "/app/family",              icon: Home,           label: "Overview",     end: true  },
  { to: "/app/family/members",      icon: Users,          label: "Members",      end: false },
  { to: "/app/family/accounts",     icon: Wallet,         label: "Accounts",     end: false },
  { to: "/app/family/transactions", icon: ArrowLeftRight, label: "Transactions", end: false },
]

type TypeFilter = "all" | "income" | "expense" | "transfer"

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all",      label: "All types" },
  { value: "expense",  label: "Expenses"  },
  { value: "income",   label: "Income"    },
  { value: "transfer", label: "Transfers" },
]

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function Family() {
  const { user } = useAuth()

  const [family,     setFamily]     = useState<FamilyWithMembers | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)

  const reload = useCallback(async () => {
    if (!user) return
    const base = await getMyFamily(user.id)
    if (base) {
      const full = await getFamilyWithMembers(base.id)
      setFamily(full)
    } else {
      setFamily(null)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const base = await getMyFamily(user.id)
      if (cancelled) return
      if (base) {
        const full = await getFamilyWithMembers(base.id)
        if (!cancelled) setFamily(full)
      } else {
        if (!cancelled) setFamily(null)
      }
      if (!cancelled) setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [user])

  const myRole = family?.members.find((m) => m.user_id === user?.id)?.role

  if (!loading && !family) {
    return (
      <div className="page-reveal flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">No family yet</h1>
          <p className="mono text-[11px] text-stone-400 mt-1.5">
            Create a family or join one with an invite code
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
            <Plus size={13} className="mr-1.5" /> Create family
          </Button>
          <Button onClick={() => setShowJoin(true)} variant="outline" className="text-[12px] h-9 px-5 border-stone-200 text-stone-600">
            Join with code
          </Button>
        </div>
        {showCreate && (
          <CreateFamilyModal
            onClose={() => setShowCreate(false)}
            onCreated={async () => { setShowCreate(false); await reload() }}
          />
        )}
        {showJoin && (
          <JoinFamilyModal
            onClose={() => setShowJoin(false)}
            onJoined={async () => { setShowJoin(false); await reload() }}
          />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-reveal">
        <div className="h-8 w-40 bg-stone-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-reveal">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Users size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">{family?.name}</h1>
            <p className="mono text-[10px] text-stone-400">
              {family?.members.length} member{family?.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {myRole === "admin" && (
          <span className="mono text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Crown size={9} /> Admin
          </span>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all",
              isActive ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Icon size={13} />{label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index               element={<FamilyOverview     family={family!} myRole={myRole} onReload={reload} />} />
        <Route path="members"      element={<FamilyMembers      family={family!} myRole={myRole} onReload={reload} />} />
        <Route path="accounts"     element={<FamilyAccounts     family={family!} />} />
        <Route path="transactions" element={<FamilyTransactions family={family!} />} />
      </Routes>
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function FamilyOverview({
  family, myRole, onReload,
}: { family: FamilyWithMembers; myRole?: string; onReload: () => void }) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const navigate  = useNavigate()

  const [copied,       setCopied]       = useState(false)
  const [leaving,      setLeaving]      = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(family.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    if (!user) return
    setLeaving(true)
    const error = await leaveFamily(family.id, user.id)
    setLeaving(false)
    setConfirmLeave(false)
    if (error) {
      toast({ type: "error", title: "Failed to leave", description: error })
    } else {
      toast({ type: "info", title: "You left the family" })
      onReload()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
        <h2 className="text-[14px] font-semibold text-stone-900 mb-1">Invite code</h2>
        <p className="mono text-[11px] text-stone-400 mb-4">Share this code so others can join</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
            <p className="mono text-[20px] font-semibold text-stone-900 tracking-[0.2em]">{family.invite_code}</p>
          </div>
          <Button onClick={copyCode} variant="outline" className="h-12 px-4 border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600">
            <Copy size={14} className="mr-1.5" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-stone-900">Members</h2>
          <button onClick={() => navigate("/app/family/members")} className="mono text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5">
            View all <ChevronRight size={10} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {family.members.slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.profile?.full_name ?? "?"} url={m.profile?.avatar_url} size="sm" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-stone-800">{m.profile?.full_name}</p>
                <p className="mono text-[10px] text-stone-400">@{m.profile?.username}</p>
              </div>
              {m.role === "admin" && (
                <span className="mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Crown size={8} /> Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {myRole !== "admin" && (
        <div className="bg-white rounded-2xl border border-red-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-red-600">Leave family</p>
              <p className="mono text-[10px] text-stone-400 mt-0.5">You can rejoin later with the invite code</p>
            </div>
            {confirmLeave ? (
              <div className="flex items-center gap-2">
                <Button onClick={handleLeave} disabled={leaving} className="text-[12px] h-9 bg-red-500 hover:bg-red-600 text-white">
                  {leaving ? "Leaving..." : "Confirm"}
                </Button>
                <Button onClick={() => setConfirmLeave(false)} variant="outline" className="text-[12px] h-9 border-stone-200 text-stone-600">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setConfirmLeave(true)} variant="outline" className="text-[12px] h-9 border-red-200 text-red-500 hover:bg-red-50">
                <LogOut size={13} className="mr-1.5" /> Leave
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Members ──────────────────────────────────────────────────────────────────

function FamilyMembers({
  family, myRole, onReload,
}: { family: FamilyWithMembers; myRole?: string; onReload: () => void }) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const handleRemove = async (member: FamilyMember) => {
    const error = await removeMember(family.id, member.user_id)
    setConfirmRemove(null)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "info", title: "Member removed" })
      onReload()
    }
  }

  const handleRoleToggle = async (member: FamilyMember) => {
    const newRole = member.role === "admin" ? "member" : "admin"
    const error   = await updateMemberRole(family.id, member.user_id, newRole)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "success", title: `Role updated to ${newRole}` })
      onReload()
    }
  }

  const handleRegenCode = async () => {
    const { code, error } = await regenerateInviteCode(family.id)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "success", title: "New invite code generated", description: code ?? "" })
      onReload()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {myRole === "admin" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-stone-800">Invite code</p>
              <p className="mono text-[14px] text-emerald-700 font-semibold tracking-[0.15em] mt-0.5">{family.invite_code}</p>
            </div>
            <Button onClick={handleRegenCode} variant="outline" className="text-[11px] h-8 px-3 border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600">
              <RefreshCw size={11} className="mr-1" /> Regenerate
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50">
          <h2 className="text-[14px] font-semibold text-stone-900">
            {family.members.length} member{family.members.length !== 1 ? "s" : ""}
          </h2>
        </div>
        {family.members.map((m) => {
          const isMe         = m.user_id === user?.id
          const isAdmin      = myRole === "admin"
          const isConfirming = confirmRemove === m.user_id
          return (
            <div key={m.id} className="flex items-center gap-3 px-5 py-4 border-b border-stone-50 last:border-0">
              <Avatar name={m.profile?.full_name ?? "?"} url={m.profile?.avatar_url} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-stone-800">
                    {m.profile?.full_name}
                    {isMe && <span className="mono text-[9px] text-stone-400 ml-1">(you)</span>}
                  </p>
                  {m.role === "admin" && (
                    <span className="mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Crown size={8} /> Admin
                    </span>
                  )}
                </div>
                <p className="mono text-[10px] text-stone-400 mt-0.5">
                  {m.profile?.email} · Joined {new Date(m.joined_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              {isAdmin && !isMe && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {isConfirming ? (
                    <>
                      <Button onClick={() => handleRemove(m)} className="text-[10px] h-7 px-2.5 bg-red-500 hover:bg-red-600 text-white">Confirm</Button>
                      <Button onClick={() => setConfirmRemove(null)} variant="outline" className="text-[10px] h-7 px-2.5 border-stone-200 text-stone-500">Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleRoleToggle(m)} variant="outline" className="text-[10px] h-7 px-2.5 border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-600">
                        {m.role === "admin" ? "Make member" : "Make admin"}
                      </Button>
                      <button onClick={() => setConfirmRemove(m.user_id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                        <UserMinus size={12} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

function FamilyAccounts({ family }: { family: FamilyWithMembers }) {
  const { user }  = useAuth()
  const { toast } = useToast()

  const [familyAccounts, setFamilyAccounts] = useState<Account[]>([])
  const [myAccounts,     setMyAccounts]     = useState<Account[]>([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      const [fa, ma] = await Promise.all([
        getFamilyAccounts(family.id),
        getAccounts(user.id),
      ])
      if (cancelled) return
      setFamilyAccounts(fa)
      setMyAccounts(ma.filter((a) => a.family_id !== family.id))
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [user, family.id])

  const refresh = async () => {
    if (!user) return
    const [fa, ma] = await Promise.all([
      getFamilyAccounts(family.id),
      getAccounts(user.id),
    ])
    setFamilyAccounts(fa)
    setMyAccounts(ma.filter((a) => a.family_id !== family.id))
  }

  const handleLink = async (accountId: string) => {
    const error = await linkAccountToFamily(accountId, family.id)
    if (error) {
      toast({ type: "error", title: "Failed to link", description: error })
    } else {
      toast({ type: "success", title: "Account shared with family" })
      await refresh()
    }
  }

  const handleUnlink = async (accountId: string) => {
    const error = await unlinkAccountFromFamily(accountId)
    if (error) {
      toast({ type: "error", title: "Failed to unlink", description: error })
    } else {
      toast({ type: "info", title: "Account removed from family" })
      await refresh()
    }
  }

  if (loading) return <div className="h-32 bg-stone-100 rounded-2xl animate-pulse" />

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50">
          <h2 className="text-[14px] font-semibold text-stone-900">Shared accounts</h2>
          <p className="mono text-[10px] text-stone-400 mt-0.5">Visible to all family members</p>
        </div>
        {familyAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet size={24} className="text-stone-200 mx-auto mb-2" />
            <p className="mono text-[11px] text-stone-400">No shared accounts yet</p>
          </div>
        ) : (
          familyAccounts.map((a) => {
            const Icon = ACCOUNT_ICONS[a.type] ?? Wallet
            return (
              <div key={a.id} className="flex items-center gap-3 px-5 py-4 border-b border-stone-50 last:border-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.color + "22" }}>
                  <Icon size={15} style={{ color: a.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-stone-800">{a.name}</p>
                  <p className="mono text-[10px] text-stone-400">₱{a.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                </div>
                <button
                  onClick={() => handleUnlink(a.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-200 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {myAccounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50">
            <h2 className="text-[14px] font-semibold text-stone-900">Share your accounts</h2>
            <p className="mono text-[10px] text-stone-400 mt-0.5">Add your personal accounts to the family</p>
          </div>
          {myAccounts.map((a) => {
            const Icon = ACCOUNT_ICONS[a.type] ?? Wallet
            return (
              <div key={a.id} className="flex items-center gap-3 px-5 py-4 border-b border-stone-50 last:border-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.color + "22" }}>
                  <Icon size={15} style={{ color: a.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-stone-800">{a.name}</p>
                  <p className="mono text-[10px] text-stone-400">₱{a.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                </div>
                <Button onClick={() => handleLink(a.id)} className="text-[11px] h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus size={11} className="mr-1" /> Share
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Transactions ─────────────────────────────────────────────────────────────

function FamilyTransactions({ family }: { family: FamilyWithMembers }) {
  const lastAdded = useAccountStore((s) => s.lastAdded)

  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)

  const [page,            setPage]            = useState(1)
  const [search,          setSearch]          = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [typeFilter,      setTypeFilter]      = useState<TypeFilter>("all")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ✅ debounce search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ✅ main fetch — server-side pagination + search + filter
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const filters: FamilyTransactionFilters = {
        page:     page,
        pageSize: PAGE_SIZE,
        search:   debouncedSearch || undefined,
        type:     typeFilter === "all" ? undefined : typeFilter,
      }
      const result = await getFamilyTransactions(family.id, filters)
      if (cancelled) return
      setTransactions(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [family.id, page, debouncedSearch, typeFilter, lastAdded])

  const handleTypeFilter = (val: TypeFilter) => {
    setTypeFilter(val)
    setPage(1)
  }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearch("")
    setDebouncedSearch("")
    setTypeFilter("all")
    setPage(1)
  }

  const hasActiveFilters = typeFilter !== "all" || debouncedSearch !== ""

  return (
    <div className="flex flex-col gap-4">

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
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

          {/* Type filter */}
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

          {/* Total count */}
          {!loading && (
            <p className="mono text-[11px] text-stone-400 ml-auto">
              {total.toLocaleString()} total
            </p>
          )}

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

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse border-b border-stone-50 last:border-0">
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
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <ArrowLeftRight size={28} className="text-stone-200 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-stone-600">
            {debouncedSearch ? "No results found" : "No shared transactions yet"}
          </p>
          <p className="mono text-[11px] text-stone-400 mt-1">
            {debouncedSearch
              ? `Nothing matches "${debouncedSearch}"`
              : "Add a transaction on a shared account to see it here"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            {transactions.map((t) => {
              const isIncome   = t.type === "income"
              const isExpense  = t.type === "expense"
              const isTransfer = t.type === "transfer"
              const Icon = isIncome ? TrendingUp : isExpense ? TrendingDown : ArrowLeftRight
              const iconColor = isIncome
                ? "text-emerald-600 bg-emerald-50"
                : isExpense
                ? "text-red-500 bg-red-50"
                : "text-sky-600 bg-sky-50"
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-stone-800 truncate">
                      {t.note || t.category || t.type}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="mono text-[10px] text-stone-400">{t.account?.name}</p>
                      {isTransfer && t.to_account?.name && (
                        <>
                          <span className="text-stone-300">→</span>
                          <p className="mono text-[10px] text-stone-400">{t.to_account.name}</p>
                        </>
                      )}
                      {t.category && !isTransfer && (
                        <>
                          <span className="text-stone-300">·</span>
                          <p className="mono text-[10px] text-stone-400">{t.category}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "mono text-[13px] font-medium",
                      isIncome ? "text-emerald-600" : isExpense ? "text-stone-800" : "text-sky-600"
                    )}>
                      {isIncome ? "+" : isExpense ? "−" : ""}
                      ₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="mono text-[9px] text-stone-300 mt-0.5">
                      {new Date(t.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )
            })}
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