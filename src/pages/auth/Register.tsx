import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterForm } from "@/schemas/Auth"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, ArrowRight, Sparkles, TrendingUp, PiggyBank, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { registerWithEmail, loginWithGoogle } from "@/services/AuthService"
import { useToast } from "@/hooks/useToast"
import logo from "@/assets/logo.png"

const perks = [
  { icon: BarChart2,  title: "Smart tracking", desc: "Auto-categorize every peso you spend.",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { icon: TrendingUp, title: "AI insights",     desc: "Get weekly summaries and spending patterns.", color: "bg-sky-50 text-sky-700 border-sky-200"             },
  { icon: PiggyBank,  title: "Savings goals",   desc: "Set targets and watch your progress grow.",   color: "bg-amber-50 text-amber-700 border-amber-200"       },
]

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const onSubmit = async (data: RegisterForm) => {
    const error = await registerWithEmail(data)

    if (error) {
      toast({ type: "error", title: "Registration failed", description: error })
      return
    }

    toast({ type: "success", title: "Account created!", description: "Check your inbox to verify your email." })
    navigate("/auth/verify-email", { state: { email: data.email } })
  }

  const handleGoogleSignUp = async () => {
    const error = await loginWithGoogle()
    if (error) toast({ type: "error", title: "Google sign up failed", description: error })
  }

  return (
    <>
      <div className="salapiq-root h-screen w-full flex items-center justify-center bg-[#f7f5f0] p-4 overflow-auto">
        <div className="w-full max-w-[900px] flex rounded-2xl overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.10)] border border-stone-200/80 my-auto">

          <div className="panel-reveal hidden md:flex flex-col justify-between w-[45%] bg-[#0f1a12] p-10 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-emerald-400/8 blur-2xl" />
            </div>
            <div className="relative z-10">
              <div className="mb-4">
                <img src={logo} alt="Salapiq" className="h-16 w-auto object-contain" />
              </div>
              <p className="mono text-[10px] tracking-[0.2em] text-emerald-500/70 uppercase mb-4">Join for free</p>
              <h2 className="text-white text-[26px] font-light leading-[1.2] tracking-tight">
                Take control of<br />
                <span className="text-emerald-400 font-medium">your finances.</span>
              </h2>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              {perks.map(({ icon: Icon, title, desc, color }, i) => (
                <div key={i} className="perk-card flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border", color)}>
                    <Icon size={13} />
                  </div>
                  <div>
                    <p className="text-white/85 text-[12px] font-medium leading-tight">{title}</p>
                    <p className="text-white/35 text-[11px] font-light mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative z-10 flex items-center gap-2 mt-4">
              <Sparkles size={12} className="text-emerald-400 ai-badge" />
              <span className="mono text-[10px] text-white/30 tracking-wide">Insights powered by AI</span>
            </div>
          </div>

          <div className="form-reveal flex-1 bg-white flex items-center justify-center px-10 py-10">
            <div className="w-full max-w-[310px]">
              <div className="flex md:hidden items-center gap-2 mb-8">
                <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">S</span>
                </div>
                <span className="font-semibold text-stone-800 tracking-tight">Salapiq</span>
              </div>
              <div className="mb-7">
                <h1 className="text-[22px] font-semibold text-stone-900 tracking-tight leading-tight">Create account</h1>
                <p className="text-stone-400 text-sm mt-1.5 font-light">Free forever. No credit card needed.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="full_name" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Full name</Label>
                  <Input id="full_name" type="text" placeholder="Juan dela Cruz" autoComplete="name"
                    className={cn("h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300", "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150", errors.full_name && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20")}
                    {...register("full_name")}
                  />
                  {errors.full_name && <p className="mono text-[11px] text-red-400">— {errors.full_name.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Email</Label>
                  <Input id="email" type="email" placeholder="juan@example.com" autoComplete="email"
                    className={cn("h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300", "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150", errors.email && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20")}
                    {...register("email")}
                  />
                  {errors.email && <p className="mono text-[11px] text-red-400">— {errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" autoComplete="new-password"
                      className={cn("h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 pr-10", "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150", errors.password && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20")}
                      {...register("password")}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="mono text-[11px] text-red-400">— {errors.password.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Confirm password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" autoComplete="new-password"
                      className={cn("h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 pr-10", "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150", errors.confirmPassword && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20")}
                      {...register("confirmPassword")}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mono text-[11px] text-red-400">— {errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className={cn("submit-btn w-full h-10 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] tracking-[0.06em] uppercase font-medium transition-colors duration-150 disabled:opacity-40")}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Creating account
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">Get started <ArrowRight size={13} className="submit-arrow" /></span>
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-stone-100" />
                  <span className="mono text-[10px] text-stone-300 tracking-wider">or</span>
                  <div className="flex-1 h-px bg-stone-100" />
                </div>

                <Button type="button" variant="outline" onClick={handleGoogleSignUp} className="w-full h-10 text-[12px] tracking-wide text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-colors">
                  <svg className="mr-2 w-3.5 h-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </form>

              <p className="mono text-center text-[11px] text-stone-300 mt-6">
                Already have an account?{" "}
                <a href="/auth/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">Sign in</a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}