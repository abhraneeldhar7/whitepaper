"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDashboardStore } from "@/lib/zustand/store";
import TabsGroup from "../tabs-group";
import OverviewTab from "./overview-tab";
import MembersTab from "./members-tab";
import PlaceholderTab from "../placeholder-tab";

const COLLECTION_TABS = ["Overview", "Members", "Settings", "How to Use"] as const;

export default function CollectionContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const papers = useDashboardStore((s) => s.papers);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "overview");
  }, [searchParams]);

  return (
    <div className="p-1 md:p-2 pt-0 md:pt-0 w-full h-full flex-1 flex flex-col">
      <div className="border rounded-md bg-background w-full h-full flex-1 flex flex-col">
        <TabsGroup tabs={COLLECTION_TABS} />
        <div className="flex-1 overflow-auto">
          {activeTab === "overview" && <OverviewTab papers={papers} />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "settings" && <PlaceholderTab name="Settings" />}
          {activeTab === "how to use" && <PlaceholderTab name="How to Use" />}
        </div>
      </div>
    </div>
  );
}
