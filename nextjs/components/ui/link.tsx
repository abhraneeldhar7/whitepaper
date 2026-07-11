import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Link2({ children, href, target, className }: { children: React.ReactNode, className?: string, href: string, target?: string }) {
    return (<Link target={target} href={href} className={cn("relative group font-[400]", className)}>
        {children}
        <div className="border-current border-t-[0.15em] w-full md:w-0 absolute bottom-[-0.2em] md:bottom-[-0.25em] left-0 group-hover:w-full transition-all ease-out"/>
    </Link>)
}