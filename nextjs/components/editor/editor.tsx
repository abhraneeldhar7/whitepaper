"use client";

import type { PaperWithRole } from "@/lib/api/services/papers";

export function PaperEditor({ paper }: { paper: PaperWithRole }) {
  return (
    <div>
      <h1>{paper.data.title}</h1>
      <p>Editor - coming soon</p>
    </div>
  );
}
