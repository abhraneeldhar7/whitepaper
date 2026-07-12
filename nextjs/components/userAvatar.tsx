import { UserRound } from "lucide-react";
import { Avatar, AvatarImage } from "./ui/avatar";

export default function UserAvatar({ src }: { src?: string }) {
    return (<Avatar className="bg-background">
        {src ?
            <AvatarImage src={src} /> :
            <div className="h-full w-full flex items-center justify-center"><UserRound size={14} /></div>
        }
    </Avatar>)
}