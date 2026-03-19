import { forwardRef } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: string
}

type SettingsSelectProps = React.ComponentPropsWithoutRef<"select"> & {
  label:    string
  icon?:    React.ElementType
  options?: SelectOption[]
  error?:   string
}

const SettingsSelect = forwardRef<HTMLSelectElement, SettingsSelectProps>(
  ({ label, icon: Icon, options, error, className, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
          {Icon && <Icon size={10} className="inline mr-1" />}
          {label}
        </Label>

        <select
          ref={ref}
          className={cn(
            "h-10 text-sm bg-stone-50 border border-stone-200 rounded-md px-3 text-stone-900",
            "focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
            "transition-colors appearance-none",
            error && "border-red-300 focus:border-red-400 focus:ring-red-400/20",
            className
          )}
          {...props}
        >
          {options
            ? options.map(({ value, label: optLabel }) => (
                <option key={value} value={value}>
                  {optLabel}
                </option>
              ))
            : children
          }
        </select>

        {error && (
          <p className="mono text-[10px] text-red-400">— {error}</p>
        )}
      </div>
    )
  }
)

SettingsSelect.displayName = "SettingsSelect"

export default SettingsSelect