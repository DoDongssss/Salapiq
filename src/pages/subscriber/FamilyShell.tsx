import { useState, useEffect, useCallback } from "react"
import { Routes, Route, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import {
  getMyFamily, getFamilyWithMembers, createFamily,
  joinFamilyByCode, leaveFamily, removeMember,
  updateMemberRole, regenerateInviteCode,
  getFamilyAccounts, getFamilyTransactions,
  linkAccountToFamily, unlinkAccountFromFamily,
  type FamilyWithMembers, type FamilyMember,
} from "@/services/FamilyService"
import { getAccounts } from "@/services/AccountService"
import {
  Users, Home, Wallet, ArrowLeftRight,
  Plus, Copy, RefreshCw, LogOut,
  Crown, UserMinus, ChevronRight, X,
  TrendingUp, TrendingDown,
  Building2, CreditCard, Smartphone,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type { Account } from "@/types/Accounts"
import type { TransactionWithAccount } from "@/services/AccountService"

const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

function Avatar({
  name, url, size = "md",
}: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm"
    ? "w-7 h-7 text-[10px]"
    : size === "lg"
    ? "w-12 h-12 text-base"
    : "w-9 h-9 text-[12px]"
  const initials = name.slice(0, 2).toUpperCase()
  return url
    ? <img src={url} alt={name} className={cn(sz, "rounded-xl object-cover shrink-0")} />
    : <div className={cn(sz, "rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 font-medium text-emerald-700 mono")}>{initials}</div>
}

const NAV = [
  { to: "/app/family",              icon: Home,           label: "Overview"      },
  { to: "/app/family/members",      icon: Users,          label: "Members"       },
  { to: "/app/family/accounts",     icon: Wallet,         label: "Accounts"      },
  { to: "/app/family/transactions", icon: ArrowLeftRight, label: "Transactions"  },
]

export default function FamilyShell() {
  const { user } = useAuth()

  const [family,     setFamily]     = useState<FamilyWithMembers | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)

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
        setFamily(null)
      }
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [user])

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

  const myRole = family?.members.find((m) => m.user_id === user?.id)?.role

  if (!loading && !family) {
    return (
      <div className="page-reveal flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">No family yet</h1>
          <p className="mono text-[11px] text-stone-400 mt-1.5">Create a family or join one with an invite code</p>
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
            onCreated={() => { setShowCreate(false); reload() }}
          />
        )}
        {showJoin && (
          <JoinFamilyModal
            onClose={() => setShowJoin(false)}
            onJoined={() => { setShowJoin(false); reload() }}
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
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/app/family"}
            className={({ isActive }) => cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all",
              isActive
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Icon size={13} />{label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index             element={<FamilyOverview     family={family!} myRole={myRole} onReload={reload} />} />
        <Route path="members"    element={<FamilyMembers      family={family!} myRole={myRole} onReload={reload} />} />
        <Route path="accounts"   element={<FamilyAccounts     family={family!} myRole={myRole} onReload={reload} />} />
        <Route path="transactions" element={<FamilyTransactions family={family!} />} />
      </Routes>
    </div>
  )
}

function FamilyOverview({
  family, myRole, onReload,
}: { family: FamilyWithMembers; myRole?: string; onReload: () => void }) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const navigate  = useNavigate()
  const [copied,  setCopied]  = useState(false)
  const [leaving, setLeaving] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(family.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    if (!user) return
    if (!confirm("Are you sure you want to leave this family?")) return
    setLeaving(true)
    const error = await leaveFamily(family.id, user.id)
    setLeaving(false)
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
        <p className="mono text-[11px] text-stone-400 mb-4">Share this code so others can join your family</p>
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
          <button
            onClick={() => navigate("/app/family/members")}
            className="mono text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight size={10} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
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
            <Button
              onClick={handleLeave}
              disabled={leaving}
              variant="outline"
              className="text-[12px] h-9 border-red-200 text-red-500 hover:bg-red-50"
            >
              <LogOut size={13} className="mr-1.5" /> Leave
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FamilyMembers({
  family, myRole, onReload,
}: { family: FamilyWithMembers; myRole?: string; onReload: () => void }) {
  const { user }  = useAuth()
  const { toast } = useToast()

  const handleRemove = async (member: FamilyMember) => {
    if (!confirm(`Remove ${member.profile?.full_name} from the family?`)) return
    const error = await removeMember(family.id, member.user_id)
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
            <Button
              onClick={handleRegenCode}
              variant="outline"
              className="text-[11px] h-8 px-3 border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600"
            >
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
          const isMe    = m.user_id === user?.id
          const isAdmin = myRole === "admin"
          return (
            <div key={m.id} className="flex items-center gap-3 px-5 py-4 border-b border-stone-50 last:border-0">
              <Avatar name={m.profile?.full_name ?? "?"} url={m.profile?.avatar_url} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-stone-800">
                    {m.profile?.full_name}{" "}
                    {isMe && <span className="mono text-[9px] text-stone-400">(you)</span>}
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
                  <Button
                    onClick={() => handleRoleToggle(m)}
                    variant="outline"
                    className="text-[10px] h-7 px-2.5 border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-600"
                  >
                    {m.role === "admin" ? "Make member" : "Make admin"}
                  </Button>
                  <button
                    onClick={() => handleRemove(m)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-200 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <UserMinus size={12} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FamilyAccounts({
  family
}: { family: FamilyWithMembers; myRole?: string; onReload: () => void }) {
  const { user }  = useAuth()
  const { toast } = useToast()
const [familyAccounts, setFamilyAccounts] = useState<Account[]>([])
const [myAccounts,     setMyAccounts]     = useState<Account[]>([])
const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
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

  const reload = useCallback(async () => {
    if (!user) return
    const [fa, ma] = await Promise.all([
      getFamilyAccounts(family.id),
      getAccounts(user.id),
    ])
    setFamilyAccounts(fa)
    setMyAccounts(ma.filter((a) => a.family_id !== family.id))
  }, [user, family.id])

  const handleLink = async (accountId: string) => {
    const error = await linkAccountToFamily(accountId, family.id)
    if (error) {
      toast({ type: "error", title: "Failed to link", description: error })
    } else {
      toast({ type: "success", title: "Account shared with family" })
      reload() 
    }
  }

  const handleUnlink = async (accountId: string) => {
    const error = await unlinkAccountFromFamily(accountId)
    if (error) {
      toast({ type: "error", title: "Failed to unlink", description: error })
    } else {
      toast({ type: "info", title: "Account removed from family" })
      reload() 
    }
  }

  if (loading) return <div className="h-32 bg-stone-100 rounded-2xl animate-pulse" />

  return (
    <div className="flex flex-col gap-5">

      <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50">
          <h2 className="text-[14px] font-semibold text-stone-900">Shared accounts</h2>
          <p className="mono text-[10px] text-stone-400 mt-0.5">Accounts visible to all family members</p>
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
                <Button
                  onClick={() => handleLink(a.id)}
                  className="text-[11px] h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
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

function FamilyTransactions({ family }: { family: FamilyWithMembers }) {
  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filterType,   setFilterType]   = useState("all")

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const txns = await getFamilyTransactions(family.id, { limit: 50 })
      if (cancelled) return
      setTransactions(txns)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [family.id])

  const filtered = transactions.filter((t) =>
    filterType === "all" ? true : t.type === filterType
  )

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center gap-1.5">
        {["all", "expense", "income", "transfer"].map((v) => (
          <button
            key={v}
            onClick={() => setFilterType(v)}
            className={cn(
              "mono text-[11px] px-3 py-1.5 rounded-lg transition-colors capitalize",
              filterType === v
                ? "bg-emerald-50 text-emerald-700"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
          >
            {v === "all" ? "All" : v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {[1, 2, 3].map((i) => (
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
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <ArrowLeftRight size={28} className="text-stone-200 mx-auto mb-3" />
          <p className="mono text-[11px] text-stone-400">No shared transactions yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          {filtered.map((t) => {
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
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-50 last:border-0">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-stone-800 truncate">
                    {t.note || t.category || t.type}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="mono text-[10px] text-stone-400">{t.account?.name}</p>
                    {isTransfer && t.to_account && (
                      <p className="mono text-[10px] text-stone-400"> → {t.to_account.name}</p>
                    )}
                    {t.member && (
                      <>
                        <span className="text-stone-300">·</span>
                        <p className="mono text-[10px] text-stone-400">{t.member.full_name}</p>
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
      )}
    </div>
  )
}

function CreateFamilyModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: () => void }) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const [name,    setName]    = useState("")
  const [desc,    setDesc]    = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!user || !name.trim()) return
    setLoading(true)
    const { error } = await createFamily({ name: name.trim(), description: desc.trim() })
    setLoading(false)
    if (error) {
      toast({ type: "error", title: "Failed to create", description: error })
    } else {
      toast({ type: "success", title: "Family created!" })
      onCreated()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-[15px] font-semibold text-stone-900">Create a family</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Family name</Label>
            <Input
              placeholder="The dela Cruz family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
              Description <span className="text-stone-300">(optional)</span>
            </Label>
            <Input
              placeholder="Our family budget tracker"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5"
            >
              {loading ? "Creating..." : "Create family"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function JoinFamilyModal({
  onClose, onJoined,
}: { onClose: () => void; onJoined: () => void }) {
  const { toast } = useToast()
  const [code,    setCode]    = useState("")
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    const { familyName, error } = await joinFamilyByCode(code.trim())
    setLoading(false)
    if (error) {
      toast({ type: "error", title: "Failed to join", description: error })
    } else {
      toast({ type: "success", title: `Joined ${familyName}!` })
      onJoined()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-[15px] font-semibold text-stone-900">Join a family</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Invite code</Label>
            <Input
              placeholder="e.g. AB12CD34"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 mono tracking-[0.15em]"
              maxLength={8}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={loading || code.length < 6}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5"
            >
              {loading ? "Joining..." : "Join family"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}