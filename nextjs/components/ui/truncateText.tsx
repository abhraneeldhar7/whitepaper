import { cn } from "@/lib/utils"

export default function TruncateText({ children, className }: { children: React.ReactNode, className?: string }) {
    return (<div className={cn("w-full relative h-[1.4em]", className)}>
        <p className="absolute top-0 left-0 right-0 truncate">{children}</p>
    </div>)
}