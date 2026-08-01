"use client";

import type { PaperWithRole } from "@/lib/api/services/papers";

interface PaperReadOnlyProps {
  paper?: PaperWithRole;
  error?: "unauthenticated" | "unauthorized";
}

export function PaperReadOnly({ paper, error }: PaperReadOnlyProps) {
  if (error === "unauthenticated") {
    return <p>Please sign in to view this paper.</p>;
  }

  if (error === "unauthorized") {
    return <p>You don't have access to this paper.</p>;
  }

  return (
    <div>
      <h1>{paper?.data.title}</h1>
      <p>Read-only view - coming soon</p>
    </div>
  );
}
