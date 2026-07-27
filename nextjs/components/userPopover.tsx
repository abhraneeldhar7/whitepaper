import { useUserData } from "@/providers/user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";
import { CircleUserIcon, CopyIcon, LogOutIcon, UserRoundIcon, XIcon } from "lucide-react";
import { User } from "@/lib/types";
import TruncateText from "./ui/truncateText";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./ui/theme-switcher";
import { cn } from "@/lib/utils";

const UserAvatar = ({ user, size, className }: { user: User, size: number, className?: string }) => {
    return (
        <div className={cn("relative overflow-hidden rounded-[50%] group", className)}>
            {/* <div className="absolute z-[2] h-[200%] w-[14px] bg-[red] top-[20%] left-[-40%] group-hover:left-[100%] group-hover:top-[-10%] transition-all"/> */}
            <Avatar className={`size-[${size}px]`}>
                {user.avatarUrl ?
                    <AvatarImage src={user?.avatarUrl} /> :
                    <AvatarFallback className="text-md">
                        {user.name[0].toUpperCase()}
                    </AvatarFallback>
                }
            </Avatar>
        </div>
    )
}

export default function UserPopover() {
    const { user } = useUserData();
    const [open, setOpen] = useState(false);


    return (<>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={!user}>
                {user ?
                    <div className="cursor-pointer select-none relative size-[30px]">
                        <div className={`absolute top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%] z-[2] flex items-center justify-center bg-card h-full w-full border ${open ? "opacity-[100]" : "opacity-0"} rounded-full transition-all duration-slow`}>
                            <XIcon size={14} />
                        </div>
                        <UserAvatar user={user} size={30} className={`${open ? "opacity-0" : "opacity-[100]"} transition-all duration-slow`} />
                    </div>
                    :
                    <Skeleton className="size-[30px] rounded-[50%]" />
                }
            </PopoverTrigger>
            <PopoverContent align="end" className="max-w-[250px]">
                {user &&
                    <div>
                        <div className="flex gap-3">
                            <UserAvatar user={user} size={45} />
                            <div className="flex flex-col w-full">
                                <TruncateText className="text-md">{user.name}</TruncateText>
                                <div className="flex gap-2 items-center pr-3">
                                    <TruncateText className="text-xs leading-[1.2em] opacity-[0.9]">{user.email}</TruncateText>
                                    <Button variant="ghost" size="icon-xs"><CopyIcon /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col mt-2">
                            <Button size="sm" variant="ghost" className="w-full justify-between">Profile <CircleUserIcon /></Button>
                            <Button size="sm" variant="ghost" className="w-full justify-between">Log out <LogOutIcon /></Button>

                            <div className="flex w-full mb-2 mt-4 items-center justify-center">
                                <ThemeSwitcher />
                            </div>
                        </div>
                    </div>
                }
            </PopoverContent>
        </Popover>
    </>)
}