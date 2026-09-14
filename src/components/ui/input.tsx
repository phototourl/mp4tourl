import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-slate-400 focus-visible:border-[#0abab5] focus-visible:ring-2 focus-visible:ring-[#0abab5]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500 dark:focus-visible:border-[#0abab5] dark:disabled:bg-slate-700",
        className
      )}
      {...props}
    />
  )
}

export { Input }
