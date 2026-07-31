"use client"
import { ChevronDown, FilePlusCornerIcon, FolderIcon, PlusIcon, StickyNoteIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DialogOverlay } from "../ui/dialog";

interface DashboardCreateButtonProps {
    onCreateProject?: () => void;
}

export default function DashboardCreateButton({ onCreateProject }: DashboardCreateButtonProps) {
    const isMobile = useIsMobile();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (<>


        {isMobile ? <>


            <div className={`fixed inset-0 bg-black/80 backdrop-blur-xs transition-all ${mobileMenuOpen ? "opacity-100 z-[50]" : "opacity-0 z-[-1]"}`} onClick={() => { setMobileMenuOpen(false) }} />

            <div className="fixed bottom-5 right-5 z-[50] flex flex-col gap-5 items-end">
                <Button variant="secondary" className={`transition-all duration-fast ease-out ${mobileMenuOpen ? "opacity-100 translate-x-0" : "translate-x-[90%] opacity-0"}`}><StickyNoteIcon />  New paper</Button>
                <Button variant="secondary" className={`transition-all duration-fast ease-out ${mobileMenuOpen ? "opacity-100 translate-x-0" : "translate-x-[90%] opacity-0"}`}><FolderIcon />  New project</Button>
                <Button variant="secondary" className={`transition-all duration-fast ease-out ${mobileMenuOpen ? "opacity-100 translate-x-0" : "translate-x-[90%] opacity-0"}`}><FilePlusCornerIcon />  Import paper</Button>

                <Button onClick={() => { setMobileMenuOpen(!mobileMenuOpen) }} size="icon-lg" className="rounded-full p-0">
                    <PlusIcon className={`transition-all ${mobileMenuOpen ? "rotate-[90deg]" : "rotate-[0deg]"}`} />
                </Button>
            </div>
        </> :

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        Create <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mx-4" sideOffset={10}>
                    <DropdownMenuItem>
                        <StickyNoteIcon />  New paper
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onCreateProject}>
                        <FolderIcon />  New project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <FilePlusCornerIcon />  Import paper
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        }
    </>
    )
}