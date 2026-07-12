import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/userAvatar";
import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
    return (
        <div className="w-full h-full min-h-screen flex flex-col bg-muted">
            <div className="flex justify-between items-center p-3 md:p-4">
                <div className="flex gap-3 items-center">
                    <Image src="/images/appLogo.png" className="rounded-sm" alt="" height={30} width={30} unoptimized />
                    <p className="text-base">Abhraneel's Workspace</p>
                    <Button className="hover:bg-background/80" variant="ghost" size="icon-xs"><ChevronsUpDown /></Button>
                </div>


                <div className="flex">
                    <UserAvatar />
                </div>


            </div>

            <div className="p-1 md:p-2 pt-0 md:pt-0 w-full h-full flex-1 bg flex flex-col">

                <div className="border rounded-md bg-background w-full h-full flex-1">
                    <div className="border-b w-full p-2 flex gap-1">
                        <Button variant="secondary" size="sm">Overview</Button>
                        <Button variant="ghost" size="sm">Overview</Button>
                        <Button variant="ghost" size="sm">Overview</Button>
                        <Button variant="ghost" size="sm">Overview</Button>
                        <Button variant="ghost" size="sm">Overview</Button>
                    </div>
                </div>
            </div>

        </div>
    );
}