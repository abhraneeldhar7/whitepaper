import { Suspense } from "react";
import { DashboardProvider } from "@/components/dashboard/dashboard-provider";

export default function DashboardStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <DashboardProvider>
        {children}
      </DashboardProvider>
    </Suspense>
  );
}
