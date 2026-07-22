"use client"

import type { ReactNode } from "react";
import DashboardTabs from "./dashboard-tabs";

interface DashboardContentProps {
  tabs: string[];
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

export default function DashboardContent({ tabs, currentTab, onTabChange, children }: DashboardContentProps) {
  return (
    <div className="p-1 md:p-2 pt-0 md:pt-0 w-full h-full flex-1 flex flex-col">
      <div className="border rounded-md bg-background w-full h-full flex-1 flex flex-col">
      <DashboardTabs tabs={tabs} activeTab={currentTab} onTabChange={onTabChange} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
