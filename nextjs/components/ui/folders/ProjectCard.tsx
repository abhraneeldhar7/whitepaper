import { cn } from "@/lib/utils";
import Image from "next/image";
import PaperVisual from "./PaperVisual";
import { ClockIcon } from "lucide-react";

interface FolderProps {
    logoUrl: string;
    folderName: string;
    timeAgo: string;
    className?: string;
}

export default function ProjectCard({
    logoUrl,
    folderName,
    timeAgo,
    className,
}: FolderProps) {
    return (
        <div className={cn("w-35 h-35 md:w-50 md:h-50 border-0 bg-[#18181b] group cursor-pointer shadow-xl rounded-3xl", className)}>

            <div className="relative rounded-[26px] border-[6px] border-[#18181b] h-full w-full">

                <div className="absolute inset-0 h-full w-full rounded-[20px] bg-gradient-to-r from-rose-400 to-red-500" />

                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[100%] h-[60%] flex justify-center items-end">
                    <PaperVisual className="absolute w-[45%] origin-bottom-right rotate-7 translate-x-[25%] translate-y-[4%] group-hover:rotate-14 group-hover:translate-x-[36%] group-hover:-translate-y-[2%]" />
                    <PaperVisual className="absolute w-[46%] origin-bottom z-10 -rotate-1 -translate-y-[4%] group-hover:-translate-y-[20%]" />
                    <PaperVisual className="absolute w-[45%] origin-bottom-left -rotate-7 -translate-x-[20%] translate-y-[6%] group-hover:-rotate-14 group-hover:-translate-x-[36%] group-hover:-translate-y-[2%]" />
                </div>


                <div className="absolute z-2 bottom-[-1px] h-[70%] w-full overflow-hidden rounded-b-[20px]">

                    <div className="relative h-full w-full overflow-hidden ">
                        <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="w-full h-[200px]"
                        >
                            <path
                                d="M 0,5
                        Q 0,0 5,0
                        L 45,0
                        C 55,0 58,15 68,15
                        L 95,15
                        Q 100,15 100,20
                        L 100,100
                        L 0,100 Z"
                                fill="#27272a"
                            />
                        </svg>

                        <div className="absolute top-0 left-0 w-full h-full z-3 p-2 flex flex-col justify-between">
                            <div className="flex flex-col gap-2.5">
                                <Image
                                    src={logoUrl}
                                    height={100}
                                    width={100}
                                    alt={`${folderName} logo`}
                                    className="w-[35px] h-[35px] rounded-[8px] object-cover bg-gray-800"
                                />
                                <span className="text-base font-medium tracking-wide text-zinc-100 leading-tight truncate">
                                    {folderName}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-zinc-300 px-[2px]">
                                <ClockIcon size={14} />
                                <span className="mt-[2px] text-xs tracking-wide">{timeAgo}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
