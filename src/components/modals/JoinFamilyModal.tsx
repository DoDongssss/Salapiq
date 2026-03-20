import { useState } from "react"
import { useToast } from "@/hooks/useToast"
import { joinFamilyByCode } from "@/services/FamilyService"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import SpinnerBtn from "@/components/customs/SpinnerBtn"

type Props = {
  onClose:  () => void
  onJoined: () => void
}

export default function JoinFamilyModal({ onClose, onJoined }: Props) {
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
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
              Invite code
            </Label>
            <Input
              placeholder="e.g. AB12CD34"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 mono tracking-[0.15em]"
              maxLength={8}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-[12px] h-9 border-stone-200 text-stone-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={loading || code.length < 6}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5"
            >
              {loading ? <SpinnerBtn label="Joining" /> : "Join family"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}