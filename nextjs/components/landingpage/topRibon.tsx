"use client";


import { XIcon } from "lucide-react";
import { useDismissible } from "@/lib/hooks/use-dismissible";
import Link2 from "../ui/link";

export default function TopRibon() {
    const { visible, dismiss } = useDismissible("top-ribbon");

    // const [visible, setVisible] = useState(true);
    // if (!visible) return null;

    return (
        <div className={`overflow-hidden bg-foreground ease-out flex items-center ${visible ? "h-[75px] md:h-[55px]" : "h-0"} transition-all`}>
            <div className="relative w-full h-full flex items-center">
                <div className="text-xs absolute bottom-0 left-0 w-full h-fit p-4">
                    <div className="text-muted site-max mx-auto w-full flex items-center justify-between text-sm font-[300] leading-[1.6] gap-4">
                        <div className="hidden md:block w-9"></div>
                        <span>Dynamic content on this website might feel insanely fast ! <Link2 className="ml-1 text-background w-fit" href="">Read how</Link2></span>

                        <button className="px-2" onClick={dismiss}>
                            <XIcon className="size-7 md:size-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}