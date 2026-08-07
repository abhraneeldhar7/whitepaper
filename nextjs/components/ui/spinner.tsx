import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ size = 20, className, ...props }: React.ComponentProps<"svg"> & { size?: number }) {
  return (
    <Loader2Icon size={size} data-slot="spinner" role="status" aria-label="Loading" className={cn("animate-spin", className)} {...props} />
  )
}

export { Spinner }
