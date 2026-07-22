"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface TabsGroupProps {
  tabs: readonly string[];
}

export default function TabsGroup({ tabs }: TabsGroupProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "overview");
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab.toLowerCase());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="border-b w-full p-2 flex gap-1">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant={activeTab === tab.toLowerCase() ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleTabChange(tab.toLowerCase())}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
}
