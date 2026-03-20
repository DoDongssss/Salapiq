import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import {
  profileSchema, updateEmailSchema,
  type Profile, type ProfileForm,
  type UpdateEmailForm, type NotificationPrefs,
} from "@/types/SettingsTypes"
import {
  getProfile, updateProfile, uploadAvatar,
  updateEmail, resendVerificationEmail, resetPassword,
  updateAiOptIn, clearLocalAiData,
  saveNotificationPrefs, getUserSettings,
  updateAppPreferences, extractNotificationPrefs,
} from "@/services/SettingsService"
import {
  SETTINGS_TABS, CURRENCIES, TIMEZONES,
  THEMES, LANGUAGES, DATE_FORMATS,
  NOTIFICATION_ROWS, PRIVACY_ROWS,
} from "@/config/subscriber"
import SettingsSelect from "@/components/customs/SettingsSelect"
import ProfileFormSkeleton from "@/components/customs/ProfileFormSkeleton"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import VerificationBanner from "@/components/customs/VerificationBanner"
import {
  Camera, CheckCircle2, Clock, Mail, Phone,
  Globe, DollarSign, ChevronRight,
  Palette, Languages as LanguagesIcon, CalendarDays, Shield,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DEFAULT_NOTIFS: NotificationPrefs = {
  weeklyReport: true, budgetAlerts: true,
  goalReminders: true, loginAlerts: true,
}

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab,         setActiveTab]         = useState("profile")
  const [profile,           setProfile]           = useState<Profile | null>(null)
  const [profileLoading,    setProfileLoading]    = useState(true)
  const [avatarUrl,         setAvatarUrl]         = useState<string | null>(null)
  const [uploadingAvatar,   setUploadingAvatar]   = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput,       setDeleteInput]       = useState("")
  const [sendingReset,      setSendingReset]      = useState(false)
  const [aiOptIn,           setAiOptIn]           = useState(true)
  const [notifications,     setNotifications]     = useState<NotificationPrefs>(DEFAULT_NOTIFS)
  const [savingNotifs,      setSavingNotifs]      = useState(false)
  const [theme,             setTheme]             = useState("light")
  const [language,          setLanguage]          = useState("en")
  const [dateFormat,        setDateFormat]        = useState("MM/DD/YYYY")
  const [savingPrefs,       setSavingPrefs]       = useState(false)

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

  const { reset: resetProfile } = profileForm

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const loadData = async () => {
      setProfileLoading(true)

      const [profileData, settingsData] = await Promise.all([
        getProfile(user.id),
        getUserSettings(user.id),
      ])

      if (cancelled) return

      if (profileData) {
        setProfile(profileData)
        setAvatarUrl(profileData.avatar_url)
        resetProfile({
          full_name:      profileData.full_name       ?? "",
          username:       profileData.username        ?? "",
          phone:          profileData.phone           ?? "",
          monthly_income: profileData.monthly_income  ?? undefined,
          currency:       profileData.currency        ?? "PHP",
          timezone:       profileData.timezone        ?? "Asia/Manila",
        })
      }

      if (settingsData) {
        setAiOptIn(settingsData.ai_opt_in    ?? profileData?.ai_opt_in ?? true)
        setTheme(settingsData.theme          ?? "light")
        setLanguage(settingsData.language    ?? "en")
        setDateFormat(settingsData.date_format ?? "MM/DD/YYYY")
        setNotifications(extractNotificationPrefs(settingsData))
      } else {
        setAiOptIn(profileData?.ai_opt_in ?? true)
        setNotifications(DEFAULT_NOTIFS)
      }

      setProfileLoading(false)
    }

    loadData()
    return () => { cancelled = true }
  }, [user, resetProfile])

  const onSaveProfile = async (data: ProfileForm) => {
    if (!user) return
    const error = await updateProfile(user.id, data)
    if (error === "USERNAME_TAKEN") {
      toast({ type: "error", title: "Username taken", description: "Try a different username." })
    } else if (error) {
      toast({ type: "error", title: "Update failed", description: error })
    } else {
      toast({ type: "success", title: "Profile updated", description: "Your changes have been saved." })
      const fresh = await getProfile(user.id)
      if (fresh) setProfile(fresh)
    }
  }

  const onUpdateEmail = async (data: UpdateEmailForm) => {
    const error = await updateEmail(data.email)
    if (error) {
      toast({ type: "error", title: "Email update failed", description: error })
    } else {
      toast({ type: "info", title: "Confirm your new email", description: "Check both inboxes to confirm the change." })
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
      setAvatarUrl(url)
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
      toast({ type: "success", title: "Verification email sent", description: "Check your inbox." })
    }
  }

  const handleAiToggle = async (value: boolean) => {
    if (!user) return
    setAiOptIn(value)
    const error = await updateAiOptIn(user.id, value)
    if (error) {
      setAiOptIn(!value)
      toast({ type: "error", title: "Failed to update", description: error })
    } else {
      toast({
        type: "info",
        title: value ? "AI insights enabled" : "AI insights disabled",
        description: value ? "Expenses will be classified locally." : "AI classification turned off.",
      })
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    setSavingNotifs(true)
    const error = await saveNotificationPrefs(user.id, notifications)
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
    const error = await updateAppPreferences(user.id, {
      theme, language, date_format: dateFormat,
    })
    setSavingPrefs(false)
    if (error) {
      toast({ type: "error", title: "Failed to save", description: error })
    } else {
      toast({ type: "success", title: "App preferences saved" })
    }
  }

  const handleDeactivate = () => {
    toast({ type: "warning", title: "Contact support", description: "Email support@salapiq.com to deactivate." })
  }

  const handleDeleteAccount = () => {
    toast({ type: "info", title: "Contact support", description: "Email support@salapiq.com for account deletion." })
    setShowDeleteConfirm(false)
  }

  const isVerified = user?.email_confirmed_at != null
  const initials   = (profile?.full_name || user?.email || "SA").slice(0, 2).toUpperCase()

  return (
    <div className="page-reveal">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Settings</h1>
        <p className="mono text-[11px] text-stone-400 mt-1">Manage your account, preferences and privacy</p>
      </div>

      <div className="flex gap-6">

        {/* ── Sidebar ── */}
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">

            {/* Avatar section */}
            <div className="px-5 pt-6 pb-5 border-b border-stone-50 flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 flex items-center justify-center">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
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
              {profileLoading
                ? <div className="h-3 w-24 bg-stone-100 rounded animate-pulse mt-1" />
                : <p className="text-[12px] font-medium text-stone-800 text-center leading-tight">
                    {profile?.full_name || user?.email?.split("@")[0]}
                  </p>
              }
              <div className="flex items-center gap-1 mt-1.5">
                {isVerified
                  ? <><CheckCircle2 size={10} className="text-emerald-500" /><span className="mono text-[9px] text-emerald-600">Verified</span></>
                  : <><Clock size={10} className="text-amber-500" /><span className="mono text-[9px] text-amber-600">Unverified</span></>
                }
              </div>
              <p className="mono text-[9px] text-stone-400 mt-1 text-center truncate w-full px-2">
                {user?.email}
              </p>
            </div>

            {/* Tab nav */}
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
            <div className="tab-content flex flex-col gap-5">

              {!isVerified && (
                <VerificationBanner onResend={handleResendVerification} />
              )}

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-5">Personal information</h2>

                {profileLoading ? (
                  <ProfileFormSkeleton />
                ) : (
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Full name</Label>
                        <Input
                          placeholder="Juan dela Cruz"
                          className={cn("h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", profileForm.formState.errors.full_name && "border-red-300")}
                          {...profileForm.register("full_name")}
                        />
                        {profileForm.formState.errors.full_name && (
                          <p className="mono text-[10px] text-red-400">— {profileForm.formState.errors.full_name.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Username</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">@</span>
                          <Input
                            placeholder="juan_123"
                            className={cn("h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", profileForm.formState.errors.username && "border-red-300")}
                            {...profileForm.register("username")}
                          />
                        </div>
                        {profileForm.formState.errors.username && (
                          <p className="mono text-[10px] text-red-400">— {profileForm.formState.errors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                        <Phone size={10} className="inline mr-1" />Phone number
                      </Label>
                      <Input
                        placeholder="+63 9XX XXX XXXX"
                        className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                        {...profileForm.register("phone")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                          <DollarSign size={10} className="inline mr-1" />Monthly income
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">₱</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                            {...profileForm.register("monthly_income", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <SettingsSelect
                        label="Currency"
                        icon={DollarSign}
                        options={CURRENCIES}
                        {...profileForm.register("currency")}
                      />
                    </div>

                    <SettingsSelect
                      label="Timezone"
                      icon={Globe}
                      options={TIMEZONES}
                      {...profileForm.register("timezone")}
                    />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={profileForm.formState.isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] tracking-wide h-9 px-5"
                      >
                        {profileForm.formState.isSubmitting ? <SpinnerBtn label="Saving" /> : "Save changes"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="tab-content flex flex-col gap-5">

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <div className="mb-5">
                  <h2 className="text-[14px] font-semibold text-stone-900">Email address</h2>
                  <p className="mono text-[11px] text-stone-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Mail size={10} />
                    <span>{user?.email}</span>
                    {isVerified
                      ? <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 size={10} /> verified</span>
                      : <span className="text-amber-500 flex items-center gap-0.5"><Clock size={10} /> unverified</span>
                    }
                  </p>
                </div>
                <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">New email address</Label>
                    <Input
                      type="email"
                      placeholder="new@example.com"
                      className={cn("h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", emailForm.formState.errors.email && "border-red-300")}
                      {...emailForm.register("email")}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="mono text-[10px] text-red-400">— {emailForm.formState.errors.email.message}</p>
                    )}
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
                <p className="mono text-[11px] text-stone-400 mb-5">
                  We'll send a reset link to <span className="text-stone-600">{user?.email}</span>
                </p>
                <Button
                  onClick={handlePasswordReset}
                  disabled={sendingReset}
                  variant="outline"
                  className="text-[12px] h-9 border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600"
                >
                  {sendingReset ? <SpinnerBtn label="Sending" lightSpinner={false} /> : "Send password reset email"}
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
            <div className="tab-content flex flex-col gap-5">

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-5">Notifications</h2>
                <div className="flex flex-col">
                  {NOTIFICATION_ROWS.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-4 border-b border-stone-50 last:border-0">
                      <div>
                        <p className="text-[13px] text-stone-800">{label}</p>
                        <p className="mono text-[10px] text-stone-400 mt-0.5">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={notifications[key]}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveNotifications} disabled={savingNotifs} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                    {savingNotifs ? <SpinnerBtn label="Saving" /> : "Save notifications"}
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-stone-900 mb-5">App preferences</h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsSelect
                      label="Theme"
                      icon={Palette}
                      options={THEMES}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                    <SettingsSelect
                      label="Language"
                      icon={LanguagesIcon}
                      options={LANGUAGES}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    />
                  </div>
                  <SettingsSelect
                    label="Date format"
                    icon={CalendarDays}
                    options={DATE_FORMATS}
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveAppPrefs} disabled={savingPrefs} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
                    {savingPrefs ? <SpinnerBtn label="Saving" /> : "Save preferences"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="tab-content flex flex-col gap-5">

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
                  <input type="checkbox" className="toggle" checked={aiOptIn} onChange={(e) => handleAiToggle(e.target.checked)} />
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
                <p className="mono text-[11px] text-stone-400 mb-4">
                  Removes all your local AI corrections from this browser. The base model remains.
                </p>
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
            <div className="tab-content flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-red-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-[14px] font-semibold text-red-600 mb-1">Danger zone</h2>
                <p className="mono text-[11px] text-stone-400 mb-5">
                  These actions are irreversible. Please proceed with caution.
                </p>

                <div className="flex items-center justify-between py-4 border-b border-stone-50">
                  <div>
                    <p className="text-[13px] font-medium text-stone-800">Deactivate account</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5">Temporarily disable your account. You can reactivate anytime.</p>
                  </div>
                  <Button variant="outline" onClick={handleDeactivate} className="text-[12px] h-9 border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-600 shrink-0">
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
                    <p className="mono text-[10px] text-red-500 mb-3">
                      Type <span className="font-medium">DELETE</span> to confirm. This will permanently erase all your data.
                    </p>
                    <Input
                      placeholder="Type DELETE to confirm"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      className="h-9 text-sm bg-white border-red-200 focus-visible:border-red-400 focus-visible:ring-red-400/20 mb-3"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleDeleteAccount} disabled={deleteInput !== "DELETE"} className="text-[12px] h-9 bg-red-500 hover:bg-red-600 text-white disabled:opacity-40">
                        Permanently delete
                      </Button>
                      <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput("") }} className="text-[12px] h-9 border-stone-200 text-stone-600">
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