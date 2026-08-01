import { cn } from "@/lib/utils";
import Image from "next/image";

interface ContainerLogoProps {
  imageUrl?: string | null;
  name: string;
  size?: number;
  className?: string
}

export default function ContainerLogo({ imageUrl, name, size = 30, className }: ContainerLogoProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-[6px] shrink-0", className)}
      />
    );
  }

  return (
    <div
      className={cn("rounded-[6px] bg-muted-foreground/20 flex items-center justify-center shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <span className="text-xs font-medium text-muted-foreground">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
