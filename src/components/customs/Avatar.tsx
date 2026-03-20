import { cn } from "@/lib/utils"

type AvatarSize = "sm" | "md" | "lg"

type AvatarProps = {
  name:  string
  url?:  string | null
  size?: AvatarSize
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-[12px]",
  lg: "w-12 h-12 text-base",
}

export default function Avatar({ name, url, size = "md" }: AvatarProps) {
  const initials  = name.slice(0, 2).toUpperCase()
  const sizeClass = SIZE_CLASSES[size]

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={cn(sizeClass, "rounded-xl object-cover shrink-0")}
      />
    )
  }

  return (
    <div className={cn(
      sizeClass,
      "rounded-xl bg-emerald-100 flex items-center justify-center shrink-0",
      "font-medium text-emerald-700 mono"
    )}>
      {initials}
    </div>
  )
}