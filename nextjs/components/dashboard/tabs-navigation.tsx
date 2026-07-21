"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const TABS = ["Overview", "Projects", "Papers", "Settings"] as const;

export default function TabsNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab.toLowerCase());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="border-b w-full p-2 flex gap-1">
      {TABS.map((tab) => (
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
