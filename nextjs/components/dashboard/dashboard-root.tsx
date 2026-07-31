"use client"

import type { ReactNode } from "react";
import UserPopover from "../userPopover";

export default function DashboardRoot({
  ribbon,
  children,
}: {
  ribbon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-muted">
      <div className="flex gap-3 justify-between items-center px-3 sm:px-1 p-1 md:p-2 py-1 md:py-2">
        {ribbon}
        <UserPopover />
      </div>
      {children}
    </div>
  );
}
