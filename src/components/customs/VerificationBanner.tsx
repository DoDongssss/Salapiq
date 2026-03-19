import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type VerificationBannerProps = {
  onResend: () => void
}

export default function VerificationBanner({ onResend }: VerificationBannerProps) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <AlertCircle size={16} className="text-amber-500 shrink-0" />
      <div className="flex-1">
        <p className="text-[13px] font-medium text-amber-800">Email not verified</p>
        <p className="mono text-[11px] text-amber-600 mt-0.5">
          Verify your email to unlock all features.
        </p>
      </div>
      <Button
        onClick={onResend}
        className="shrink-0 h-8 px-3 text-[11px] bg-amber-500 hover:bg-amber-600 text-white"
      >
        Send verification
      </Button>
    </div>
  )
}