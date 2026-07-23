"use client"

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DashboardTabsProps {
  tabs: string[];
  onTabChange: (tab: string) => void;
}

function normalize(tab: string) {
  return tab.toLowerCase().replace(/\s+/g, "_");
}

export default function DashboardTabs({ tabs, onTabChange }: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onTabChangeRef = useRef(onTabChange);
  onTabChangeRef.current = onTabChange;

  const currentTab = searchParams.get("tab") || normalize(tabs[0]);

  useEffect(() => {
    onTabChangeRef.current(currentTab);
  }, [currentTab]);

  const handleClick = (tab: string) => {
    const normalized = normalize(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", normalized);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="border-b w-full p-2 flex gap-1">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant={currentTab === normalize(tab) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleClick(tab)}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
}
