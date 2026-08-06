import type { Paper } from "@/shared/types";

interface PaperReadOnlyProps {
  paper?: Paper;
  error?: string;
}

export default function PaperReadOnly({ paper, error }: PaperReadOnlyProps) {
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this paper.</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Paper not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{paper.title}</h1>
      <div className="border rounded-lg p-4 min-h-[400px] bg-muted/20">
        <p className="text-muted-foreground">ReadOnly placeholder — viewing &quot;{paper.title}&quot;</p>
      </div>
    </div>
  );
}
