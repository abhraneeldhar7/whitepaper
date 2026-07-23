import { useUserData } from "@/providers/user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";

export default function UserPopover() {
    const { user } = useUserData();
    const [open, setOpen] = useState(false);

    return (<>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={!user}>
                {user ?
                    <Avatar>
                        {user.avatarUrl ?
                            <AvatarImage src={user?.avatarUrl} /> :
                            <AvatarFallback className="text-md">
                                {user.name[0].toUpperCase()}
                            </AvatarFallback>
                        }
                    </Avatar> :
                    <Skeleton className="size-[30px] rounded-[50%]"/>
                }
            </PopoverTrigger>
            <PopoverContent align="end" className="max-w-[220px]">

            </PopoverContent>
        </Popover>
    </>)
}