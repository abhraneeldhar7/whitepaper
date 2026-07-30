import { ChevronDown, FilePlusCornerIcon, FilePlusIcon, FolderIcon, StickyNoteIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export default function DashboardCreateButton() {
    return (<DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button className="border-0 gap-2">
                Create <ChevronDown />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem>
                <StickyNoteIcon />  New paper
            </DropdownMenuItem>
            <DropdownMenuItem>
                <FolderIcon />  New project
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem>
                <FilePlusCornerIcon />  Import paper
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>)
}