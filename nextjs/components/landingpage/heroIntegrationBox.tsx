"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";

export interface AppItem {
    logo: StaticImageData;
    name: string;
}

interface HeroIntegrationBoxProps {
    items: AppItem[];
    reverse?: boolean;
}

export default function HeroIntegrationBox({ items, reverse = false }: HeroIntegrationBoxProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (!items || items.length === 0) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % items.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [items]);

    if (!items || items.length === 0) return null;

    return (
        // Standard relative container. No grid hacks needed.
        <div className="relative w-full overflow-hidden h-full" suppressHydrationWarning>
            {items.map((item, index) => {
                const isActive = index === activeIndex;
                const isPrev = index === (activeIndex - 1 + items.length) % items.length;

                let positionClass = `opacity-0 z-0 ${reverse ? "-translate-y-8" : "translate-y-8"}`;

                if (isActive) {
                    positionClass = "translate-y-0 opacity-100 z-10";
                } else if (isPrev) {
                    positionClass = `opacity-0 z-0 ${reverse ? "translate-y-8" : "-translate-y-8"}`;
                }

                return (
                    <div
                        key={item.name}
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out md:gap-3 ${positionClass}`}
                    >
                        <Image
                            src={item.logo}
                            height={40} width={40}
                            alt={`${item.name} logo`}
                            className="object-contain h-[35px] md:h-[35px] aspect-square"
                        />
                        <span className="text-md hidden md:inline">
                            {item.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}