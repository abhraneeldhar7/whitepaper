import Image from "next/image";
import { Building } from "lucide-react";

interface WorkspaceLogoProps {
  src?: string | null;
  name: string;
  size?: number;
}

export default function WorkspaceLogo({ src, name, size = 30 }: WorkspaceLogoProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-sm"
        unoptimized
      />
    );
  }

  return (
    <div
      className="rounded-sm bg-muted-foreground/20 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Building size={size * 0.5} className="text-muted-foreground" />
    </div>
  );
}
