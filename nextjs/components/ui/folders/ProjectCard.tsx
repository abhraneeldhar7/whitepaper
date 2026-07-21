import { LockIcon } from "lucide-react";
import Link from "next/link";
import { Collection, Project } from "@/lib/types";
import FolderVisuals from "./folderVisuals";

export default function FolderCard({
    content,
    href,
    showLockIcon = true,
}: {
    content: Project | Collection;
    href: string;
    showLockIcon?: boolean;
}) {
    return (
        <div className="flex flex-col items-center">
            <Link href={href} >
                <div className="relative inline-flex">
                    <FolderVisuals />
                    {showLockIcon && content.visibility !== "public" ? (
                        <span className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-2">
                            <LockIcon size={22} strokeWidth={3} className="text-destructive" />
                        </span>
                    ) : null}
                </div>
            </Link>
            <p className="text-sm ">{content.name}</p>
        </div>
    );
}

