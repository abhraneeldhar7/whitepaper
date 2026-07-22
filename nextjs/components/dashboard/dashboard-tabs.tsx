"use client"

import { Button } from "@/components/ui/button";

interface DashboardTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function normalize(tab: string) {
  return tab.toLowerCase().replace(/\s+/g, "_");
}

export default function DashboardTabs({ tabs, activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="border-b w-full p-2 flex gap-1">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant={activeTab === normalize(tab) ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onTabChange(normalize(tab))}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
}
