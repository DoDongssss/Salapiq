import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useProfileStore }  from "@/stores/useProfileStore"
import { useSettingStore } from "@/stores/useSettingStore"
import {
  profileSchema, updateEmailSchema,
  type ProfileForm, type UpdateEmailForm,
} from "@/types/SettingsTypes"
import {
  uploadAvatar, updateEmail,
  resendVerificationEmail, resetPassword,
  clearLocalAiData,
} from "@/services/SettingsService"
import {
  SETTINGS_TABS, CURRENCIES, TIMEZONES,
  THEMES, LANGUAGES, DATE_FORMATS,
  NOTIFICATION_ROWS, PRIVACY_ROWS,
} from "@/config/subscriber"
import Switch from "@/components/customs/Switch"
import SettingsSelect from "@/components/customs/SettingsSelect"
import {FieldSkeleton} from "@/components/customs/FieldSkeleton"
import {
  Camera, CheckCircle2, Clock, Mail, Phone,
  Globe, DollarSign, ChevronRight, Shield,
  Palette, Languages as LanguagesIcon, CalendarDays,
  AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Settings() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const profile             = useProfileStore((s) => s.profile)
  const profileLoading      = useProfileStore((s) => s.loading)
  const profileInitialized  = useProfileStore((s) => s.initialized)
  const refreshProfile      = useProfileStore((s) => s.refresh)
  const updateProfile       = useProfileStore((s) => s.update)
  const getAvatarUrl        = useProfileStore((s) => s.avatarUrl)

  const storeTheme      = useSettingStore((s) => s.theme)
  const storeLanguage   = useSettingStore((s) => s.language)
  const storeDateFormat = useSettingStore((s) => s.dateFormat)
  const storeAiOptIn    = useSettingStore((s) => s.aiOptIn)
  const storeNotifs     = useSettingStore((s) => s.notifs)
  const updatePrefs     = useSettingStore((s) => s.updatePrefs)
  const updateNotifs    = useSettingStore((s) => s.updateNotifs)
  const updateAiOptIn   = useSettingStore((s) => s.updateAiOptIn)

  const [activeTab,         setActiveTab]         = useState("profile")
  const [localAvatarUrl,    setLocalAvatarUrl]    = useState<string | null>(null)
  const [uploadingAvatar,   setUploadingAvatar]   = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput,       setDeleteInput]       = useState("")
  const [sendingReset,      setSendingReset]      = useState(false)
  const [savingNotifs,      setSavingNotifs]      = useState(false)
  const [savingPrefs,       setSavingPrefs]       = useState(false)
  const [localTheme,        setLocalTheme]        = useState(storeTheme)
  const [localLanguage,     setLocalLanguage]     = useState(storeLanguage)
  const [localDateFormat,   setLocalDateFormat]   = useState(storeDateFormat)
  const [localNotifs,       setLocalNotifs]       = useState(storeNotifs)
  const [localAiOptIn,      setLocalAiOptIn]      = useState(storeAiOptIn)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name:      "",
      username:       "",
      phone:          "",
      monthly_income: undefined,
      currency:       "PHP",
      timezone:       "Asia/Manila",
    },
  })

  const emailForm = useForm<UpdateEmailForm>({
    resolver: zodResolver(updateEmailSchema),
  })

  // ── Reset form when profile loads from store ──────────────
  useEffect(() => {
    if (!profile || profileLoading) return
    profileForm.reset({
      full_name:      profile.full_name      ?? "",
      username:       profile.username       ?? "",
      phone:          profile.phone          ?? "",
      monthly_income: profile.monthly_income ?? undefined,
      currency:       profile.currency       ?? "PHP",
      timezone:       profile.timezone       ?? "Asia/Manila",
    }, { keepDirty: false })
  }, [profile, profileLoading])

  // ── Sync local pref state when store loads ────────────────
  useEffect(() => { setLocalTheme(storeTheme)           }, [storeTheme])
  useEffect(() => { setLocalLanguage(storeLanguage)     }, [storeLanguage])
  useEffect(() => { setLocalDateFormat(storeDateFormat) }, [storeDateFormat])
  useEffect(() => { setLocalNotifs(storeNotifs)         }, [storeNotifs])
  useEffect(() => { setLocalAiOptIn(storeAiOptIn)       }, [storeAiOptIn])

  const onSaveProfile = async (data: ProfileForm) => {
    if (!user) return
    const error = await updateProfile(user.id, data)
    if (error === "USERNAME_TAKEN") {
      toast({ type: "error", title: "Username taken", description: "Try a different username." })
    } else if (error) {
      toast({ type: "error", title: "Update failed", description: error })
    } else {
      toast({ type: "success", title: "Profile updated" })
    }
  }

  const onUpdateEmail = async (data: UpdateEmailForm) => {
    const error = await updateEmail(data.email)
    if (error) {
      toast({ type: "error", title: "Email update failed", description: error })
    } else {
      toast({ type: "info", title: "Confirm your new email", description: "Check both inboxes to confirm." })
      emailForm.reset()
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    const { url, error } = await uploadAvatar(user.id, file)
    setUploadingAvatar(false)
    if (error) {
      toast({ type: "error", title: "Upload failed", description: error })
    } else {
      setLocalAvatarUrl(url)
      refreshProfile(user.id)
      toast({ type: "success", title: "Avatar updated!" })
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setSendingReset(true)
    const error = await resetPassword(user.email)
    setSendingReset(false)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "success", title: "Reset link sent", description: "Check your inbox." })
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) return
    const error = await resendVerificationEmail(user.email)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "success", title: "Verification email sent" })
    }
  }

  const handleAiToggle = async (value: boolean) => {
    if (!user) return
    setLocalAiOptIn(value)
    const error = await updateAiOptIn(user.id, value)
    if (error) {
      setLocalAiOptIn(!value)
      toast({ type: "error", title: "Failed to update", description: error })
    } else {
      toast({ type: "info", title: value ? "AI insights enabled" : "AI insights disabled" })
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    setSavingNotifs(true)
    const error = await updateNotifs(user.id, localNotifs)
    setSavingNotifs(false)
    if (error) {
      toast({ type: "error", title: "Failed to save", description: error })
    } else {
      toast({ type: "success", title: "Preferences saved" })
    }
  }

  const handleSaveAppPrefs = async () => {
    if (!user) return
    setSavingPrefs(true)
    const error = await updatePrefs(user.id, {
      theme:       localTheme,
      language:    localLanguage,
      date_format: localDateFormat,
    })
    setSavingPrefs(false)
    if (error) {
      toast({ type: "error", title: "Failed to save", description: error })
    } else {
      toast({ type: "success", title: "App preferences saved" })
    }
  }

  const isVerified = user?.email_confirmed_at != null
  const displayUrl = localAvatarUrl ?? getAvatarUrl()
  const initials   = (profile?.full_name || user?.email || "SA").slice(0, 2).toUpperCase()

  return (
    <div className="page-reveal">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Settings</h1>
        <p className="mono text-[11px] text-stone-400 mt-1">Manage your account, preferences and privacy</p>
      </div>

      <div className="flex gap-6">

        <div className="w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <div className="px-5 pt-6 pb-5 border-b border-stone-50 flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 flex items-center justify-center">
                  {displayUrl
                    ? <img src={displayUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="mono text-xl font-medium text-emerald-700">{initials}</span>
                  }
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors">
                  <Camera size={11} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </div>
                )}
              </div>
              {profileLoading ? (
                <div className="h-3 w-24 bg-stone-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-[12px] font-medium text-stone-800 text-center leading-tight">
                  {profile?.full_name || user?.email?.split("@")[0]}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                {isVerified
                  ? <><CheckCircle2 size={10} className="text-emerald-500" /><span className="mono text-[9px] text-emerald-600">Verified</span></>
                  : <><Clock size={10} className="text-amber-500" /><span className="mono text-[9px] text-amber-600">Unverified</span></>
                }
              </div>
              <p className="mono text-[9px] text-stone-400 mt-1 text-center truncate w-full px-2">{user?.email}</p>
            </div>
            <div className="p-2">
              {SETTINGS_TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-150 mb-0.5",
                    activeTab === id
                      ? id === "danger" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                  )}
                >
                  <div className="flex items-center gap-2"><Icon size={13} />{label}</div>
                  <ChevronRight size={10} className="opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">

          {activeTab === "profile" && (
            <div className="flex flex-col gap-5">
              {!isVerified && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-amber-800">Email not verified</p>
                    <p className="mono text-[11px] text-amber-600 mt-0.5">Verify your email to unlock all features.</p>
                  </div>
                  <Button onClick={handleResendVerification} className="shrink-0 h-8 px-3 text-[11px] bg-amber-500 hover:bg-amber-600 text-white">
                    Send verification
                  </Button>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-5">Personal information</h2>
                {!profileInitialized || profileLoading ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5"><div className="h-3 w-16 bg-stone-100 rounded animate-pulse" /><FieldSkeleton /></div>
                      <div className="flex flex-col gap-1.5"><div className="h-3 w-16 bg-stone-100 rounded animate-pulse" /><FieldSkeleton /></div>
                    </div>
                    <div className="flex flex-col gap-1.5"><div className="h-3 w-20 bg-stone-100 rounded animate-pulse" /><FieldSkeleton /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5"><div className="h-3 w-20 bg-stone-100 rounded animate-pulse" /><FieldSkeleton /></div>
                      <div className="flex flex-col gap-1.5"><div className="h-3 w-20 bg-stone-100 rounded animate-pulse" /><FieldSkeleton /></div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Full name</Label>
                        <Input placeholder="Juan dela Cruz" className={cn("h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", profileForm.formState.errors.full_name && "border-red-300")} {...profileForm.register("full_name")} />
                        {profileForm.formState.errors.full_name && <p className="mono text-[10px] text-red-400">— {profileForm.formState.errors.full_name.message}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Username</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">@</span>
                          <Input placeholder="juan_123" className={cn("h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", profileForm.formState.errors.username && "border-red-300")} {...profileForm.register("username")} />
                        </div>
                        {profileForm.formState.errors.username && <p className="mono text-[10px] text-red-400">— {profileForm.formState.errors.username.message}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400"><Phone size={10} className="inline mr-1" />Phone number</Label>
                      <Input placeholder="+63 9XX XXX XXXX" className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20" {...profileForm.register("phone")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400"><DollarSign size={10} className="inline mr-1" />Monthly income</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">₱</span>
                          <Input type="number" placeholder="0" className="h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20" {...profileForm.register("monthly_income", { valueAsNumber: true })} />
                        </div>
                      </div>
                      <SettingsSelect label="Currency" icon={DollarSign} {...profileForm.register("currency")}>
                        {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </SettingsSelect>
                    </div>
                    <SettingsSelect label="Timezone" icon={Globe} {...profileForm.register("timezone")}>
                      {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </SettingsSelect>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={profileForm.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                        {profileForm.formState.isSubmitting
                          ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving</span>
                          : "Save changes"
                        }
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <div className="mb-5">
                  <h2 className="text-[14px] font-semibold text-stone-900">Email address</h2>
                  <p className="mono text-[11px] text-stone-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Mail size={10} /><span>{user?.email}</span>
                    {isVerified
                      ? <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={10} /> verified</span>
                      : <span className="text-amber-500 flex items-center gap-0.5"><Clock size={10} /> unverified</span>
                    }
                  </p>
                </div>
                <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">New email address</Label>
                    <Input type="email" placeholder="new@example.com" className={cn("h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", emailForm.formState.errors.email && "border-red-300")} {...emailForm.register("email")} />
                    {emailForm.formState.errors.email && <p className="mono text-[10px] text-red-400">— {emailForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={emailForm.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                      Update email
                    </Button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-1">Password</h2>
                <p className="mono text-[11px] text-stone-400 mb-5">We'll send a reset link to <span className="text-stone-600">{user?.email}</span></p>
                <Button onClick={handlePasswordReset} disabled={sendingReset} variant="outline" className="text-[12px] h-9 border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600">
                  {sendingReset
                    ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" />Sending</span>
                    : "Send password reset email"
                  }
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-4">Active session</h2>
                <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Shield size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-medium text-stone-800">Current browser session</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5">Signed in as {user?.email}</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5">
                      Last active: {new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className="mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">Active</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-5">Notifications</h2>
                <div className="flex flex-col">
                  {NOTIFICATION_ROWS.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-4 border-b border-stone-50 last:border-0">
                      <div>
                        <p className="text-[13px] text-stone-800">{label}</p>
                        <p className="mono text-[10px] text-stone-400 mt-0.5">{desc}</p>
                      </div>
                      <Switch
                        checked={localNotifs[key]}
                        onChange={(val) => setLocalNotifs((prev) => ({ ...prev, [key]: val }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveNotifications} disabled={savingNotifs} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                    {savingNotifs
                      ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving</span>
                      : "Save notifications"
                    }
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-5">App preferences</h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsSelect label="Theme" icon={Palette} value={localTheme} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalTheme(e.target.value)}>
                      {THEMES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </SettingsSelect>
                    <SettingsSelect label="Language" icon={LanguagesIcon} value={localLanguage} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalLanguage(e.target.value)}>
                      {LANGUAGES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </SettingsSelect>
                  </div>
                  <SettingsSelect label="Date format" icon={CalendarDays} value={localDateFormat} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalDateFormat(e.target.value)}>
                    {DATE_FORMATS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </SettingsSelect>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveAppPrefs} disabled={savingPrefs} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                    {savingPrefs
                      ? <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving</span>
                      : "Save preferences"
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[14px] font-semibold text-stone-900">AI expense classification</h2>
                  <span className="mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">Privacy-first</span>
                </div>
                <p className="mono text-[11px] text-stone-400 mb-5 leading-relaxed">
                  Salapiq's AI runs entirely in your browser using Transformers.js. Your expense data is never sent to any server.
                </p>
                <div className="flex items-center justify-between py-4 border-t border-stone-50">
                  <div>
                    <p className="text-[13px] text-stone-800">Enable AI classification</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5">Auto-suggest categories when you add expenses</p>
                  </div>
                  <Switch checked={localAiOptIn} onChange={handleAiToggle} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-4">How your data is used</h2>
                {PRIVACY_ROWS.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 py-3.5 border-b border-stone-50 last:border-0">
                    <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-[12px] font-medium text-stone-800">{title}</p>
                      <p className="mono text-[10px] text-stone-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-1">Clear AI training data</h2>
                <p className="mono text-[11px] text-stone-400 mb-4">Removes all your local AI corrections from this browser. The base model remains.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearLocalAiData()
                    toast({ type: "info", title: "AI data cleared", description: "Your local corrections have been removed." })
                  }}
                  className="text-[12px] h-9 border-stone-200 text-stone-600 hover:border-red-300 hover:text-red-500"
                >
                  Clear local AI data
                </Button>
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-red-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-red-600 mb-1">Danger zone</h2>
                <p className="mono text-[11px] text-stone-400 mb-5">These actions are irreversible. Please proceed with caution.</p>

                <div className="flex items-center justify-between py-4 border-b border-stone-50">
                  <div>
                    <p className="text-[13px] font-medium text-stone-800">Deactivate account</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5">Temporarily disable your account. You can reactivate anytime.</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast({ type: "warning", title: "Contact support", description: "Email support@salapiq.com to deactivate." })}
                    className="text-[12px] h-9 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-600 shrink-0"
                  >
                    Deactivate
                  </Button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-[13px] font-medium text-red-600">Delete account</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5">Permanently delete your account and all data. Cannot be undone.</p>
                  </div>
                  <Button onClick={() => setShowDeleteConfirm(true)} className="text-[12px] h-9 bg-red-500 hover:bg-red-600 text-white shrink-0">
                    Delete account
                  </Button>
                </div>

                {showDeleteConfirm && (
                  <div className="mt-2 rounded-xl bg-red-50 border border-red-200 p-4">
                    <p className="text-[13px] font-medium text-red-700 mb-1">Are you absolutely sure?</p>
                    <p className="mono text-[10px] text-red-500 mb-3">Type <span className="font-medium">DELETE</span> to confirm. This will permanently erase all your data.</p>
                    <Input
                      placeholder="Type DELETE to confirm"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      className="h-9 text-sm bg-white border-red-200 focus-visible:border-red-400 focus-visible:ring-red-400/20 mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          toast({ type: "info", title: "Contact support", description: "Email support@salapiq.com for account deletion." })
                          setShowDeleteConfirm(false)
                        }}
                        disabled={deleteInput !== "DELETE"}
                        className="text-[12px] h-9 bg-red-500 hover:bg-red-600 text-white disabled:opacity-40"
                      >
                        Permanently delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteInput("") }}
                        className="text-[12px] h-9 border-stone-200 text-stone-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}