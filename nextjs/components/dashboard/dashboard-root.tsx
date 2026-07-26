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
      <div className="flex justify-between items-center p-3 md:p-4">
        {ribbon}
        <UserPopover />
      </div>
      {children}
    </div>
  );
}
